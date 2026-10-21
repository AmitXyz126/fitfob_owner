import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import axios from 'axios';

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
  confidence: number;
  reason: string;
}

const ANALYSIS_PROMPT = `Analyze this gym / fitness club image (interior or exterior) and identify the specific facility, zone, or area shown.

Categories to match from:
${GYM_AREA_CATEGORIES.filter((c) => c !== 'Other').join(', ')}

Rules:
- Identify the facility or zone shown in the photo.
- Return the best matching category name from the list above, or a clean, specific title (e.g. "Cardio Area", "Free Weights Area", "CrossFit / Functional Zone", "Reception & Waiting", "Parking Area", "Swimming Pool", "Locker Room", "Cafeteria / Juice Bar").
- If the image shows specific gym equipment (e.g., treadmills, dumbbells, squat racks, boxing bags), map it to the corresponding gym area.
- Only return "Other" if the image is completely blank, unreadable, or totally unrelated to a gym or fitness facility.
- Confidence must be between 0 and 1.
- Do not identify people.

Return ONLY a valid JSON object in this format:
{
  "area": "Cardio Area",
  "confidence": 0.95,
  "reason": "Visible treadmills and cardio equipment."
}`;

/**
 * Analyzes a gym image using Gemini Vision API and identifies the specific facility area.
 */
export async function analyzeGymImage(photoUri: string): Promise<GymAreaAnalysisResult> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY in environment variables.');
  }

  // 1. Resize and compress to base64 for fast, reliable mobile network upload
  let base64Data = '';
  try {
    const manipulated = await manipulateAsync(
      photoUri,
      [{ resize: { width: 640 } }],
      { compress: 0.6, format: SaveFormat.JPEG, base64: true }
    );
    base64Data = manipulated.base64 || '';
  } catch (err) {
    console.warn('Image manipulation failed, trying raw URI:', err);
  }

  if (!base64Data) {
    throw new Error('Unable to process image data for analysis.');
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            text: ANALYSIS_PROMPT,
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  };

  // Fast, high-availability Gemini models with vision capabilities
  const models = [
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
  ];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const candidate = response.data?.candidates?.[0];
      const parts = candidate?.content?.parts;

      if (!parts || !Array.isArray(parts) || parts.length === 0) {
        continue;
      }

      // In thinking/multimodal models, find the non-thought part that contains the text
      const textPart =
        parts.find((p: any) => !p.thought && typeof p.text === 'string' && p.text.trim().length > 0)
          ?.text || parts[0]?.text;

      if (!textPart) {
        continue;
      }

      // Safely extract JSON from raw text output
      const jsonMatch = textPart.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : textPart.trim();
      const parsed = JSON.parse(jsonStr);

      const area: string = (parsed.area || '').trim();
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.85;
      const reason: string = parsed.reason || '';

      // Match or relate to standard categories
      let resolvedArea: string = area;
      const matchedCategory = GYM_AREA_CATEGORIES.find(
        (c) =>
          c.toLowerCase() === area.toLowerCase() ||
          c.toLowerCase().replace(/ area| zone| room| studio/g, '').trim() ===
            area.toLowerCase().replace(/ area| zone| room| studio/g, '').trim()
      );

      if (matchedCategory && matchedCategory !== 'Other') {
        resolvedArea = matchedCategory;
      } else if (resolvedArea && resolvedArea.toLowerCase() !== 'other' && resolvedArea.toLowerCase() !== 'unknown') {
        // Format as Title Case
        resolvedArea = resolvedArea
          .split(' ')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      } else {
        // If area was Other or Unknown, check if reason mentions specific keywords
        const lowerReason = reason.toLowerCase();
        if (lowerReason.includes('treadmill') || lowerReason.includes('cardio') || lowerReason.includes('cycle') || lowerReason.includes('elliptical')) {
          resolvedArea = 'Cardio Area';
        } else if (lowerReason.includes('dumbbell') || lowerReason.includes('barbell') || lowerReason.includes('free weight')) {
          resolvedArea = 'Free Weights Area';
        } else if (lowerReason.includes('bench') || lowerReason.includes('weight') || lowerReason.includes('machine')) {
          resolvedArea = 'Weight Training Area';
        } else if (lowerReason.includes('reception') || lowerReason.includes('desk') || lowerReason.includes('counter')) {
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
        confidence,
        reason,
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} analysis failed:`, err?.response?.data || err?.message);
    }
  }

  throw lastError || new Error('Failed to analyze gym image.');
}

