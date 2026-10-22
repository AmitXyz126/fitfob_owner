import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import CryptoJS from 'crypto-js';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '@/api/endpoint';
import { useAuthStore } from '@/store/useAuthStore';
import { storageAPI } from '@/utility/storage';

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

export interface BackendGeminiKeyConfig {
  key: string;
  isActive: boolean;
}

// Encryption secret for backend encrypted Gemini API key (loaded securely from environment)
export const GEMINI_AES_SECRET =
  process.env.EXPO_PUBLIC_GEMINI_ENCRYPTION_KEY ||
  process.env.GEMINI_ENCRYPTION_KEY ||
  'FitfobFitnessClub@2026';

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

import { decryptGeminiApiKeyGcm } from '@/utility/cryptoUtil';

/**
 * Decrypts AES-256 encrypted Gemini API key formatted as "ivHex:ciphertextHex".
 * Primary: Native Web Crypto API (AES-256-GCM, 12-byte IV, 128-bit tag, SHA-256 key derivation)
 * Secondary Fallback: Multi-mode CryptoJS
 */
export async function decryptGeminiApiKey(
  encryptedKey: string,
  secret: string = GEMINI_AES_SECRET
): Promise<string> {
  if (!encryptedKey || typeof encryptedKey !== 'string') {
    throw new Error('Invalid encrypted Gemini API key.');
  }

  const trimmed = encryptedKey.trim();

  // If already a plain unencrypted API key
  if (trimmed.startsWith('AIzaSy') || trimmed.startsWith('AQ.') || !trimmed.includes(':')) {
    return trimmed;
  }

  // 1. Primary: AES-256-GCM (Web Crypto API with React Native Hermes fallback)
  try {
    const decryptedGcm = await decryptGeminiApiKeyGcm(trimmed, secret);
    if (decryptedGcm) {
      return decryptedGcm;
    }
  } catch (gcmErr: any) {
    console.warn('[GeminiService] GCM decrypt attempt failed:', gcmErr?.message);
  }

  // 2. Fallback: CryptoJS multi-mode
  const parts = trimmed.split(':');
  if (parts.length < 2) {
    throw new Error('Invalid key format. Expected "ivHex:ciphertextHex"');
  }

  const ivHex = parts[0];
  const cipherHex = parts[1];

  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Hex.parse(cipherHex),
  });

  const candidateKeys = [
    CryptoJS.SHA256(secret),
    CryptoJS.enc.Utf8.parse(secret),
    secret,
  ];

  const modes = [
    CryptoJS.mode.CBC,
    CryptoJS.mode.CTR,
    CryptoJS.mode.CFB,
    CryptoJS.mode.OFB,
    CryptoJS.mode.ECB,
  ];

  for (const key of candidateKeys) {
    for (const mode of modes) {
      try {
        const decrypted = CryptoJS.AES.decrypt(cipherParams as any, key as any, {
          iv,
          mode,
          padding: mode === CryptoJS.mode.CTR ? CryptoJS.pad.NoPadding : CryptoJS.pad.Pkcs7,
        });

        const plainText = decrypted.toString(CryptoJS.enc.Utf8);
        if (plainText && plainText.length >= 8 && /^[\x20-\x7E]+$/.test(plainText)) {
          return plainText.trim();
        }
      } catch {
        // try next
      }
    }
  }

  throw new Error('Failed to decrypt Gemini API key with AES-256.');
}

// In-memory cache for backend settings (short 5 seconds so toggle changes in Admin Panel reflect almost immediately)
let cachedConfig: { key: string; isActive: boolean; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 1000; // 5 seconds

/**
 * Fetches the Gemini API Key configuration from backend:
 * GET https://backend.fitfob.com/api/gemini-api-key (with Bearer Token)
 */
export async function fetchBackendGeminiConfig(
  forceRefresh: boolean = false
): Promise<BackendGeminiKeyConfig | null> {
  const now = Date.now();
  if (!forceRefresh && cachedConfig && now - cachedConfig.timestamp < CACHE_TTL_MS) {
    return { key: cachedConfig.key, isActive: cachedConfig.isActive };
  }

  try {
    const user = useAuthStore.getState().user;
    let token = user?.token || user?.jwt;

    if (!token) {
      try {
        const stored = await storageAPI.getItem('authUser');
        if (stored) {
          const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
          token = parsed?.token || parsed?.jwt;
        }
      } catch (err) {
        console.warn('[GeminiService] Error reading auth token from storageAPI:', err);
      }
    }

    if (!token) {
      try {
        const raw = await AsyncStorage.getItem('authUser');
        if (raw) {
          const parsed = JSON.parse(raw);
          token = parsed?.token || parsed?.jwt;
        }
      } catch (err) {
        // ignore
      }
    }

    const endpointUrl =
      ENDPOINTS.GEMINI_API_KEY || 'https://backend.fitfob.com/api/gemini-api-key';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.get(endpointUrl, {
      headers,
      timeout: 10000,
    });

    const data = response.data?.data;
    if (!data) {
      console.warn('[GeminiService] No data returned from gemini-api-key endpoint');
      return null;
    }

    const config: BackendGeminiKeyConfig = {
      key: data.key || '',
      isActive: Boolean(data.isActive),
    };

    cachedConfig = { ...config, timestamp: now };
    return config;
  } catch (error: any) {
    const status = error?.response?.status;
    const errorData = error?.response?.data;

    if (status === 403) {
      console.warn(
        '[GeminiService] 403 Forbidden: Endpoint /api/gemini-api-key requires permission in Strapi Admin (Settings > Users & Permissions > Roles > Authenticated > gemini-api-key).'
      );
    } else {
      console.warn(
        `[GeminiService] Failed to fetch Gemini config (status: ${status || 'network error'}):`,
        errorData || error?.message
      );
    }

    // Gracefully return null so app never crashes or shows loud 403 errors
    return null;
  }
}

/**
 * Normalizes raw model output or backend response to standard GymAreaAnalysisResult.
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
 * Analyzes a gym image using Google Gemini (via @google/genai SDK with gemini-3.8-flash)
 * based strictly on backend settings (GET /api/gemini-api-key).
 *
 * Strict Rules:
 * - If isActive === false (or config missing): Returns null (manual category selection).
 * - If isActive === true:
 *   a) Decrypts key with AES-256 using secure secret.
 *   b) Calls Google Gemini via @google/genai with gemini-3.8-flash.
 *   c) Passes photo base64 to identify Gym equipment / Facility name and category.
 */
export async function analyzeGymImage(
  photoUri: string
): Promise<GymAreaAnalysisResult | null> {
  // 1. Fetch backend settings
  const config = await fetchBackendGeminiConfig();

  // Strict Rule: If backend setting is inactive or disabled -> DO NOT SCAN, return null immediately
  if (!config || !config.isActive) {
    console.log('[GeminiService] Gemini AI is inactive/disabled in backend settings (isActive = false). Manual mode active.');
    return null;
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

  // Helper to sanitize error messages and prevent leaking API keys or credentials in logs
  const sanitizeMessage = (msg: string): string => {
    if (!msg) return 'Unknown error';
    return msg
      .replace(/([?&]key=)[^&\s"']+/gi, '$1[REDACTED]')
      .replace(/(AIzaSy[A-Za-z0-9_-]{33})/g, '[REDACTED_API_KEY]');
  };

  // 3. Security Fix (Requirement 12):
  // Check if backend provides a server-side AI analysis proxy endpoint.
  // If available, execute entirely on backend so encryption keys and Gemini calls never touch client code.
  try {
    const backendAnalyzeEndpoint = `${ENDPOINTS.GEMINI_API_KEY}/analyze`;

    const serverRes = await axios.post(
      backendAnalyzeEndpoint,
      { imageBase64: base64Data },
      {
        headers: {
          'Content-Type': 'application/json',
        },
   
      }
    );

    if (serverRes?.data?.data) {
      return normalizeAnalysisResult(serverRes.data.data);
    }
  } catch (backendErr: any) {
    // If backend proxy endpoint is not implemented (404/405), fallback to client-side @google/genai
    const status = backendErr?.response?.status;
    if (status !== 404 && status !== 405) {
      console.warn('[GeminiService] Backend proxy analysis attempt responded with:', status || backendErr?.message);
    }
  }

  if (!config.key) {
    console.warn('[GeminiService] Gemini API key is missing from backend configuration.');
    return null;
  }

  // 4. Decrypt plain Gemini API Key from backend encrypted key
  let plainApiKey = '';
  try {
    plainApiKey = await decryptGeminiApiKey(config.key);
    console.log('[GeminiService] Successfully decrypted Gemini API key from backend settings.');
  } catch (e: any) {
    console.warn('[GeminiService] Failed to decrypt backend key:', e?.message);
    return null;
  }

  if (!plainApiKey) {
    return null;
  }

  // 5. Call Google Gemini using the current @google/genai SDK with gemini-3.8-flash model
  // Note: Legacy sampling parameters (temperature, topP, topK) are removed for Gemini 3.8 compatibility.
  const ai = new GoogleGenAI({ apiKey: plainApiKey });

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

    // Fast-fail if API key is invalid or unauthorized (401/403)
    if (
      /API key not valid|API_KEY_INVALID|UNAUTHENTICATED|ACCESS_TOKEN_TYPE_UNSUPPORTED|PERMISSION_DENIED/i.test(
        sanitized
      ) &&
      !/not found|NOT_FOUND|unsupported/i.test(sanitized)
    ) {
      throw new Error(
        'Gemini API key is invalid, expired, or unauthorized. Please verify your Gemini API key in FitFob Admin Panel.'
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

  // 6. Parse and clean JSON output with robust malformed response handling
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
