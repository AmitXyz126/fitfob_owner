import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { GoogleGenAI } from '@google/genai';

export const GYM_AREA_CATEGORIES = [
  'Cardio Area',
  'Free Weights Area',
  'Weight Training Area',
  'CrossFit / Functional Zone',
  'Yoga & Aerobics Studio',
  'Personal Training Area',
  'Stretching Area',
  'Boxing / Combat Zone',
  'Reception & Waiting',
  'Parking Area',
  'Cafeteria / Juice Bar',
  'Swimming Pool',
  'Steam & Sauna',
  'Locker Room',
  'Shower & Washroom',
  'Gym Exterior / Entrance',
  'Office',
  'Other',
] as const;

export type GymAreaCategory = (typeof GYM_AREA_CATEGORIES)[number];

export interface GymAreaAnalysisResult {
  area: GymAreaCategory | string;
  category?: string;
  equipment?: string[];
  facilityName?: string;
  confidence: number;
  reason: string;
}

const ANALYSIS_PROMPT = `Analyze this gym / fitness club image (interior or exterior) and identify the specific facility, zone, or equipment shown.

Categories to match from:
${GYM_AREA_CATEGORIES.filter((c) => c !== 'Other').join(', ')}

Rules:
- Identify any visible gym equipment (e.g. Treadmill, Dumbbells, Squat Rack, Cable Machine, Punching Bag, Smith Machine, Leg Press, Barbell, Elliptical) or facility elements (Reception Desk, Swimming Pool, Lockers, Turf, Yoga Mats, Sauna, Entrance).
- Select the best matching primary category from the list above for the photo caption.
- Provide a concise name for the facility/equipment (e.g. "Cardio Area - Treadmills", "Free Weights Area - Dumbbells", "Reception & Waiting").
- Confidence must be a float between 0 and 1.
- Do not identify people.
- Only return "Other" if the image is completely unrelated to a gym or fitness facility.

Return ONLY a valid JSON object matching this schema:
{
  "area": "Cardio Area",
  "category": "Cardio Area",
  "equipment": ["Treadmill", "Elliptical"],
  "facilityName": "Cardio Area",
  "confidence": 0.95,
  "reason": "Clear view of treadmill rows and cardio equipment."
}`;

/**
 * Normalizes raw model output to standard GymAreaAnalysisResult.
 */
function normalizeAnalysisResult(parsed: any): GymAreaAnalysisResult {
  const rawArea: string = (parsed?.area || parsed?.category || parsed?.facilityName || '').trim();
  const confidence = typeof parsed?.confidence === 'number' ? parsed.confidence : 0.9;
  const reason: string = parsed?.reason || '';
  const equipment: string[] = Array.isArray(parsed?.equipment) ? parsed.equipment : [];
  const facilityName: string = parsed?.facilityName || rawArea;

  // Match against standard categories
  let resolvedArea: string = rawArea;
  const matchedCategory = GYM_AREA_CATEGORIES.find(
    (c) =>
      c.toLowerCase() === rawArea.toLowerCase() ||
      c.toLowerCase().replace(/ area| zone| room| studio/g, '').trim() ===
        rawArea.toLowerCase().replace(/ area| zone| room| studio/g, '').trim()
  );

  if (matchedCategory && matchedCategory !== 'Other') {
    resolvedArea = matchedCategory;
  } else if (
    resolvedArea &&
    resolvedArea.toLowerCase() !== 'other' &&
    resolvedArea.toLowerCase() !== 'unknown'
  ) {
    resolvedArea = resolvedArea
      .split(' ')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  } else {
    // If area was Other or Unknown, check if equipment or reason mentions specific keywords
    const lowerReason = (reason + ' ' + equipment.join(' ')).toLowerCase();
    if (
      lowerReason.includes('treadmill') ||
      lowerReason.includes('cardio') ||
      lowerReason.includes('cycle') ||
      lowerReason.includes('elliptical')
    ) {
      resolvedArea = 'Cardio Area';
    } else if (
      lowerReason.includes('dumbbell') ||
      lowerReason.includes('barbell') ||
      lowerReason.includes('free weight')
    ) {
      resolvedArea = 'Free Weights Area';
    } else if (
      lowerReason.includes('bench') ||
      lowerReason.includes('weight') ||
      lowerReason.includes('machine') ||
      lowerReason.includes('squat rack')
    ) {
      resolvedArea = 'Weight Training Area';
    } else if (
      lowerReason.includes('reception') ||
      lowerReason.includes('desk') ||
      lowerReason.includes('counter')
    ) {
      resolvedArea = 'Reception & Waiting';
    } else if (lowerReason.includes('pool') || lowerReason.includes('swim')) {
      resolvedArea = 'Swimming Pool';
    } else if (lowerReason.includes('park')) {
      resolvedArea = 'Parking Area';
    } else {
      resolvedArea = 'Other';
    }
  }

  return {
    area: resolvedArea,
    category: resolvedArea,
    equipment,
    facilityName,
    confidence,
    reason,
  };
}

/**
 * Helper to sanitize error messages and prevent leaking API keys in logs
 */
const sanitizeMessage = (msg: string): string => {
  if (!msg) return 'Unknown error';
  return msg
    .replace(/([?&]key=)[^&\s"']+/gi, '$1[REDACTED]')
    .replace(/(AIzaSy[A-Za-z0-9_-]{33})/g, '[REDACTED_API_KEY]')
    .replace(/(AQ\.[A-Za-z0-9_-]{40,})/g, '[REDACTED_API_KEY]');
};

/**
 * Analyzes a gym image directly on the frontend using Google Gemini (via @google/genai SDK with gemini-3.8-flash)
 * using EXPO_PUBLIC_GEMINI_API_KEY from environment variables (.env.local).
 */
export async function analyzeGymImage(
  photoUri: string
): Promise<GymAreaAnalysisResult | null> {
  // 1. Get API key from environment variable
  const apiKey = (
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    console.warn('[GeminiService] Missing EXPO_PUBLIC_GEMINI_API_KEY in environment variables.');
    throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY in environment variables.');
  }

  // 2. Resize and compress to base64 for fast mobile upload
  let base64Data = '';
  try {
    const manipulated = await manipulateAsync(
      photoUri,
      [{ resize: { width: 640 } }],
      { compress: 0.6, format: SaveFormat.JPEG, base64: true }
    );
    base64Data = manipulated.base64 || '';
  } catch (err) {
    console.warn('[GeminiService] Image manipulation failed, trying raw URI:', err);
  }

  if (!base64Data) {
    throw new Error('Unable to process image data for analysis.');
  }

  // 3. Call Google Gemini directly via @google/genai SDK with gemini-3.8-flash
  const ai = new GoogleGenAI({ apiKey });

  const promptPart = ANALYSIS_PROMPT;
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Data,
    },
  };

  let textOutput = '';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [promptPart, imagePart],
      config: {
        responseMimeType: 'application/json',
      },
    });

    textOutput = response.text || '';
  } catch (err: any) {
    const sanitized = sanitizeMessage(err?.message || String(err));
    console.warn('[GeminiService] gemini-3.8-flash request failed:', sanitized);

    // Google project restricted/denied access (403 PERMISSION_DENIED)
    if (/denied access|Your project has been denied access/i.test(sanitized)) {
      throw new Error(
        'Your Google AI Studio project is marked as "Restricted" by Google. Please create/import an active Google Cloud project in Google AI Studio.'
      );
    }

    // Fast-fail if API key is invalid or unauthorized
    if (
      /API key not valid|API_KEY_INVALID|UNAUTHENTICATED|ACCESS_TOKEN_TYPE_UNSUPPORTED|PERMISSION_DENIED/i.test(
        sanitized
      ) &&
      !/not found|NOT_FOUND|unsupported/i.test(sanitized)
    ) {
      throw new Error(
        'Gemini API key is invalid, expired, or unauthorized. Please verify your Gemini API key in .env.local.'
      );
    }

    // Fast-fail if quota exhausted
    if (/RESOURCE_EXHAUSTED|quota|RATE_LIMIT/i.test(sanitized)) {
      throw new Error(
        'Gemini API quota exceeded for your project. Please check quota limits in Google AI Studio.'
      );
    }

    // Model not found or unavailable
    if (/not found|NOT_FOUND|unsupported/i.test(sanitized)) {
      throw new Error(
        'The gemini-3.8-flash model is not found or not supported for this API key. Please check enabled models in Google AI Studio.'
      );
    }

    // Network or other error
    if (/network|timeout|ECONNREFUSED|ENOTFOUND/i.test(sanitized)) {
      throw new Error(
        'Network error while connecting to Gemini AI service. Please check your internet connection.'
      );
    }

    throw new Error(
      sanitized || 'Gemini model returned an empty response. Please try again.'
    );
  }

  if (!textOutput || textOutput.trim().length === 0) {
    throw new Error('Gemini model returned an empty response. Please try again.');
  }

  // 4. Parse and clean JSON output with robust malformed response handling
  let parsed: any = null;
  try {
    let cleanText = textOutput.trim();
    // Strip markdown code fences if present
    cleanText = cleanText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '$1').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : cleanText;
    parsed = JSON.parse(jsonStr);
  } catch (parseErr) {
    console.warn('[GeminiService] Failed to parse model output as JSON. Extracting fallback fields.');
    const areaMatch = textOutput.match(/"(?:area|category)"\s*:\s*"([^"]+)"/i);
    const confidenceMatch = textOutput.match(/"confidence"\s*:\s*([0-9.]+)/i);
    const reasonMatch = textOutput.match(/"reason"\s*:\s*"([^"]+)"/i);
    parsed = {
      area: areaMatch ? areaMatch[1] : 'Other',
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7,
      reason: reasonMatch ? reasonMatch[1] : 'Extracted from raw model text',
    };
  }

  return normalizeAnalysisResult(parsed);
}
