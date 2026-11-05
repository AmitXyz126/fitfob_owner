import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

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
  if (lower.includes('yoga') || lower.includes('aerobic') || lower.includes('dance')) {
    return 'Yoga & Aerobics Studio';
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
    .replace(/(gsk_[A-Za-z0-9_-]{40,})/g, '[REDACTED_API_KEY]');
};

/**
 * Analyzes gym image using Groq Vision (Qwen 3.8 27B)
 * Lightning fast ~0.15s, 100% Free, Zero Billing required.
 * Returns the detected area name (e.g. "Cardio Area", "Yoga & Aerobics Studio", "Free Weights Area")
 */
export async function analyzeGymImage(photoUri: string): Promise<GymAreaAnalysisResult | null> {
  const apiKey = (
    process.env.EXPO_PUBLIC_GROQ_API_KEY ||
    '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'
  ).trim();

  if (!apiKey) {
    console.warn('[AiService] Missing Groq API key.');
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
    console.warn('[AiService] Image manipulation failed, using raw URI:', err);
  }

  if (!base64Data) {
    return null;
  }

  // 2. Call Groq Vision (qwen/qwen3.8-27b)
  let textOutput = '';
  try {
    console.log('[AiService] Scanning gym area with Groq Vision...');
    const startTime = Date.now();

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: ANALYSIS_PROMPT },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64Data}` },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    const elapsedMs = Date.now() - startTime;

    if (groqRes.ok) {
      const data = await groqRes.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content && content.trim().length > 0) {
        textOutput = content.trim();
        console.log(`[AiService] Groq scan completed in ${elapsedMs}ms`);
      }
    } else {
      const errText = await groqRes.text();
      console.warn('[AiService] Groq vision returned status:', groqRes.status, sanitizeMessage(errText));
    }
  } catch (groqErr: any) {
    console.warn('[AiService] Groq request error:', groqErr?.message);
    return null;
  }

  if (!textOutput) {
    console.warn('[AiService] No response from AI vision engine.');
    return null;
  }

  // 3. Parse JSON output
  try {
    let cleanText = textOutput.trim().replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '$1').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleanText);
    const area = normalizeArea(parsed?.area || parsed?.category || '');
    const confidence = typeof parsed?.confidence === 'number' ? parsed.confidence : 0.95;

    console.log(`[AiService] Auto-detected category: "${area}" (${Math.round(confidence * 100)}% match)`);

    return {
      area,
      category: area,
      confidence,
    };
  } catch (parseErr) {
    const areaMatch = textOutput.match(/"(?:area|category)"\s*:\s*"([^"]+)"/i);
    if (areaMatch) {
      const area = normalizeArea(areaMatch[1]);
      console.log(`[AiService] Auto-detected category (regex fallback): "${area}"`);
      return { area, category: area, confidence: 0.9 };
    }
    return null;
  }
}
