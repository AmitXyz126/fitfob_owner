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
  area: string;
  category?: string;
  confidence: number;
  reason?: string;
}

const ANALYSIS_PROMPT = `You are a gym and fitness club photo classifier.
Analyze this gym photo and select the single best matching area name from this list:
${GYM_AREA_CATEGORIES.filter((c) => c !== 'Other').join(', ')}

Rules:
1. Return ONLY valid JSON in this exact format:
{
  "area": "Cardio Area",
  "confidence": 0.95
}
2. "area" MUST be one of the categories listed above.
3. If treadmills, bikes, or ellipticals are visible, return "Cardio Area".
4. If dumbbells, barbells, or weight plates are visible, return "Free Weights Area".
5. If machines/cables/squat racks are visible, return "Weight Training Area".
6. If reception counter or lobby is visible, return "Reception & Waiting".
7. Only return "Other" if the photo is completely unrelated to a gym or fitness facility.`;

/**
 * Normalizes raw model output to standard category
 */
function normalizeArea(rawArea: string): string {
  const clean = (rawArea || '').trim();
  if (!clean) return 'Other';

  const matched = GYM_AREA_CATEGORIES.find(
    (c) =>
      c.toLowerCase() === clean.toLowerCase() ||
      c.toLowerCase().replace(/ area| zone| room| studio/g, '').trim() ===
        clean.toLowerCase().replace(/ area| zone| room| studio/g, '').trim()
  );

  if (matched && matched !== 'Other') {
    return matched;
  }

  // Fallback keyword check
  const lower = clean.toLowerCase();
  if (lower.includes('cardio') || lower.includes('treadmill') || lower.includes('cycle')) {
    return 'Cardio Area';
  }
  if (lower.includes('free weight') || lower.includes('dumbbell') || lower.includes('barbell')) {
    return 'Free Weights Area';
  }
  if (lower.includes('weight') || lower.includes('machine') || lower.includes('squat')) {
    return 'Weight Training Area';
  }
  if (lower.includes('reception') || lower.includes('waiting') || lower.includes('lobby')) {
    return 'Reception & Waiting';
  }
  if (lower.includes('pool') || lower.includes('swim')) {
    return 'Swimming Pool';
  }
  if (lower.includes('crossfit') || lower.includes('functional')) {
    return 'CrossFit / Functional Zone';
  }

  return clean;
}

/**
 * Helper to sanitize error messages and prevent leaking API keys in logs
 */
const sanitizeMessage = (msg: string): string => {
  if (!msg) return 'Unknown error';
  return msg
    .replace(/([?&]key=)[^&\s"']+/gi, '$1[REDACTED]')
    .replace(/(AIzaSy[A-Za-z0-9_-]{33})/g, '[REDACTED_API_KEY]')
    .replace(/(AQ\.[A-Za-z0-9_-]{40,})/g, '[REDACTED_API_KEY]')
    .replace(/(gsk_[A-Za-z0-9_-]{40,})/g, '[REDACTED_API_KEY]');
};

/**
 * Analyzes gym image directly using Gemini Flash-Lite (Super fast 1-2 seconds, 100% Free)
 * Returns the detected area name (e.g. "Cardio Area", "Free Weights Area")
 */
export async function analyzeGymImage(photoUri: string): Promise<GymAreaAnalysisResult | null> {
  const apiKey = (
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    console.warn('[GeminiService] Missing EXPO_PUBLIC_GEMINI_API_KEY');
    return null;
  }

  // 1. Resize and compress to base64 (512px, 0.5 quality = ~30KB for lightning speed)
  let base64Data = '';
  try {
    const manipulated = await manipulateAsync(
      photoUri,
      [{ resize: { width: 512 } }],
      { compress: 0.5, format: SaveFormat.JPEG, base64: true }
    );
    base64Data = manipulated.base64 || '';
  } catch (err) {
    console.warn('[GeminiService] Image manipulation failed, using raw URI:', err);
  }

  if (!base64Data) {
    return null;
  }

  // 2. Call Gemini Flash-Lite
  const ai = new GoogleGenAI({ apiKey });
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Data,
    },
  };

  const activeModels = ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];
  let textOutput = '';
  let lastError: any = null;

  for (const modelName of activeModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [ANALYSIS_PROMPT, imagePart],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      if (response.text && response.text.trim().length > 0) {
        textOutput = response.text;
        break;
      }
    } catch (err: any) {
      lastError = err;
      const sanitized = sanitizeMessage(err?.message || String(err));
      console.warn(`[GeminiService] ${modelName} error:`, sanitized);
      if (/503|high demand|UNAVAILABLE|not found|NOT_FOUND/i.test(sanitized)) {
        continue;
      }
      if (/API key not valid|API_KEY_INVALID|UNAUTHENTICATED|RESOURCE_EXHAUSTED/i.test(sanitized)) {
        break;
      }
    }
  }

  if (!textOutput) {
    if (lastError) {
      console.warn('[GeminiService] Analysis failed:', sanitizeMessage(lastError?.message || ''));
    }
    return null;
  }

  // 3. Parse JSON output
  try {
    let cleanText = textOutput.trim().replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '$1').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleanText);
    const area = normalizeArea(parsed?.area || parsed?.category || '');
    const confidence = typeof parsed?.confidence === 'number' ? parsed.confidence : 0.95;

    return {
      area,
      category: area,
      confidence,
    };
  } catch (parseErr) {
    const areaMatch = textOutput.match(/"(?:area|category)"\s*:\s*"([^"]+)"/i);
    if (areaMatch) {
      const area = normalizeArea(areaMatch[1]);
      return { area, category: area, confidence: 0.9 };
    }
    return null;
  }
}
