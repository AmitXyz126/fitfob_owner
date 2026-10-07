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

Give a concise, clean, and professional name for the specific area (e.g. "Parking Area", "Cardio Area", "Free Weights Area", "Strength Training Area", "CrossFit Zone", "Yoga Studio", "Reception & Entry", "Cafeteria / Juice Bar", "Swimming Pool", "Steam & Sauna", "Locker Room", "Changing Room", "Shower Area", "Boxing Ring", "Gym Entrance", "Stretching Area", "Personal Training Area", etc.).

Return ONLY valid JSON:
{
  "area": "Parking Area",
  "confidence": 0.95,
  "reason": "Dedicated vehicle parking area for gym members."
}

Rules:
- Accurately identify the real gym facility, zone, or area shown in the photo.
- Use a clear, concise capitalized title (e.g. "Parking Area", "Cardio Area", "Reception", "Swimming Pool").
- If the image is completely unrelated to a gym or fitness facility, or totally unrecognizable, return "Other".
- Confidence must be between 0 and 1.
- Base the result only on visible information.
- Do not identify people.`;

/**
 * Analyzes a gym image using Gemini Vision API and identifies the specific facility area.
 */
export async function analyzeGymImage(photoUri: string): Promise<GymAreaAnalysisResult> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY in environment variables.');
  }

  // 1. Resize and compress to base64 for fast, reliable upload
  let base64Data = '';
  try {
    const manipulated = await manipulateAsync(
      photoUri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: SaveFormat.JPEG, base64: true }
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

  const models = ['gemini-3.5-flash-lite', 'gemini-3-flash-preview', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      });

      const candidate = response.data?.candidates?.[0];
      const rawText = candidate?.content?.parts?.[0]?.text;

      if (!rawText) {
        continue;
      }

      // Parse JSON from output
      const cleaned = rawText.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleaned);

      const area: string = (parsed.area || 'Other').trim();
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.9;
      const reason: string = parsed.reason || '';

      // 1. Check if it matches or closely relates to one of our standard categories
      let resolvedArea: string = area;
      const matchedCategory = GYM_AREA_CATEGORIES.find(
        (c) =>
          c.toLowerCase() === area.toLowerCase() ||
          c.toLowerCase().replace(/ area| zone| room| studio/g, '').trim() ===
            area.toLowerCase().replace(/ area| zone| room| studio/g, '').trim()
      );

      if (matchedCategory && matchedCategory !== 'Other') {
        resolvedArea = matchedCategory;
      } else if (resolvedArea && resolvedArea.toLowerCase() !== 'other') {
        // Keep the real AI detected name in Title Case (e.g. "Parking Area", "Badminton Court", "Juice Bar")
        resolvedArea = resolvedArea
          .split(' ')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      } else {
        resolvedArea = 'Other';
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
