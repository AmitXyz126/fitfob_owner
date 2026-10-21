import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import CryptoJS from 'crypto-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

export const GEMINI_AES_SECRET = 'FitfobFitnessClub@2026';

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
 * Analyzes a gym image using Google Gemini Flash (@google/generative-ai)
 * based strictly on backend settings (GET /api/gemini-api-key).
 *
 * Strict Rules:
 * - If isActive === false (or config missing): Returns null (image analysis will NOT run; manual category selection).
 * - If isActive === true:
 *   a) Decrypts key with AES-256 using secret "FitfobFitnessClub@2026".
 *   b) Calls Google Gemini via @google/generative-ai.
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

  if (!config.key) {
    console.warn('[GeminiService] Gemini API key is missing from backend configuration.');
    return null;
  }
console.log("[GeminiService] Gemini API key from backend configuration:", config.key);
  // 2. Decrypt plain Gemini API Key from backend encrypted key
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

  // 3. Resize and compress to base64 for fast mobile upload
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

  // 4. Call Google Gemini using official @google/generative-ai SDK with modern model fallbacks
  const genAI = new GoogleGenerativeAI(plainApiKey);

  const candidateModels = [
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-flash-lite-latest',
    'gemini-1.5-flash',
  ];

  const promptPart = ANALYSIS_PROMPT;
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Data,
    },
  };

  let textOutput = '';
  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const response = await model.generateContent([promptPart, imagePart]);
      textOutput = response.response.text();
      if (textOutput && textOutput.trim().length > 0) {
        break;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[GeminiService] Model ${modelName} failed:`, err?.message || err);
    }
  }

  if (!textOutput) {
    throw lastError || new Error('Gemini model returned an empty response.');
  }

  // 5. Parse and clean JSON output
  const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : textOutput.trim();
  const parsed = JSON.parse(jsonStr);

  const rawArea: string = (parsed.area || parsed.category || parsed.facilityName || '').trim();
  const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.9;
  const reason: string = parsed.reason || '';
  const equipment: string[] = Array.isArray(parsed.equipment) ? parsed.equipment : [];
  const facilityName: string = parsed.facilityName || rawArea;

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
