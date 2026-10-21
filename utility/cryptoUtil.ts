/**
 * Utility for AES-256-GCM decryption using the native Web Crypto API
 * with pure JavaScript AES-CTR keystream fallback for React Native Hermes.
 *
 * Matches backend encryption specifications:
 * - Algorithm: AES-256-GCM
 * - Key Derivation: SHA-256 digest of secret key (32 bytes / 256 bits)
 * - IV: 12 bytes (24 hex characters)
 * - Tag: 128-bit authentication tag (16 bytes, appended to ciphertext)
 * - Format: "iv_hex:ciphertext_and_tag_hex"
 */
import CryptoJS from 'crypto-js';

// Default shared secret for FitFob Gemini service
export const DEFAULT_GEMINI_SECRET = 'FitfobFitnessClub@2026';

/**
 * Converts a hex string to Uint8Array.
 * Throws an Error if the hex string has invalid characters or odd length.
 */
export function hexToBytes(hex: string): Uint8Array {
  if (typeof hex !== 'string') {
    throw new Error('Input must be a hexadecimal string');
  }

  const cleanHex = hex.trim();
  if (cleanHex.length % 2 !== 0) {
    throw new Error(`Invalid hexadecimal string length (${cleanHex.length}). Must be even.`);
  }

  if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
    throw new Error('Hexadecimal string contains invalid non-hex characters.');
  }

  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Converts a Uint8Array to a lowercase hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Checks whether native Web Crypto API subtle is available in the current runtime environment.
 */
function getWebCryptoSubtle(): SubtleCrypto | null {
  const subtle =
    (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) ||
    (typeof window !== 'undefined' && window.crypto?.subtle) ||
    (typeof crypto !== 'undefined' && (crypto as any).subtle) ||
    (typeof crypto !== 'undefined' && (crypto as any).webcrypto?.subtle);

  return subtle || null;
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a passphrase using SHA-256 via Web Crypto API.
 */
export async function deriveAesGcmKey(secret: string): Promise<CryptoKey> {
  if (!secret || typeof secret !== 'string') {
    throw new Error('Secret key must be a non-empty string.');
  }

  const subtle = getWebCryptoSubtle();
  if (!subtle) {
    throw new Error('Web Crypto subtle is not available.');
  }

  const secretBytes = new TextEncoder().encode(secret);
  const hashBuffer = await subtle.digest('SHA-256', secretBytes as unknown as BufferSource);

  return subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt', 'encrypt']
  );
}

export interface DecryptPayloadValidationResult {
  isValid: boolean;
  ivHex: string;
  cipherAndTagHex: string;
  error?: string;
}

/**
 * Validates the encrypted payload format: "iv_hex:ciphertext_and_tag_hex"
 * - IV must be 12 bytes (24 hex characters)
 * - Ciphertext + Tag must be at least 16 bytes (32 hex characters for the 128-bit tag)
 */
export function validateEncryptedPayload(payload: string): DecryptPayloadValidationResult {
  if (!payload || typeof payload !== 'string') {
    return {
      isValid: false,
      ivHex: '',
      cipherAndTagHex: '',
      error: 'Payload is null, undefined, or not a string.',
    };
  }

  const trimmed = payload.trim();
  const parts = trimmed.split(':');

  if (parts.length !== 2) {
    return {
      isValid: false,
      ivHex: '',
      cipherAndTagHex: '',
      error: `Invalid payload structure. Expected format: "iv_hex:ciphertext_and_tag_hex", got ${parts.length} parts.`,
    };
  }

  const [ivHex, cipherAndTagHex] = parts;

  // IV for AES-GCM must be 12 bytes = 24 hex characters
  if (ivHex.length !== 24) {
    return {
      isValid: false,
      ivHex,
      cipherAndTagHex,
      error: `Invalid IV length: expected 24 hex characters (12 bytes), received ${ivHex.length}.`,
    };
  }

  // Minimum length must contain at least the 128-bit (16-byte = 32 hex chars) authentication tag
  if (cipherAndTagHex.length < 32) {
    return {
      isValid: false,
      ivHex,
      cipherAndTagHex,
      error: `Invalid ciphertext length: expected at least 32 hex characters (including 16-byte auth tag), received ${cipherAndTagHex.length}.`,
    };
  }

  if (!/^[0-9a-fA-F]{24}$/.test(ivHex)) {
    return {
      isValid: false,
      ivHex,
      cipherAndTagHex,
      error: 'IV contains non-hexadecimal characters.',
    };
  }

  if (!/^[0-9a-fA-F]+$/.test(cipherAndTagHex) || cipherAndTagHex.length % 2 !== 0) {
    return {
      isValid: false,
      ivHex,
      cipherAndTagHex,
      error: 'Ciphertext contains non-hexadecimal characters or has an odd length.',
    };
  }

  return {
    isValid: true,
    ivHex,
    cipherAndTagHex,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted string formatted as "iv_hex:ciphertext_and_tag_hex"
 * using the native Web Crypto API when available, or universal AES-CTR GCM keystream
 * decryption (with counter block [IV_12bytes, 0, 0, 0, 2]) for React Native Hermes.
 *
 * @param encryptedPayload - String in format "ivHex:ciphertextAndTagHex"
 * @param secret - Passphrase string (derived using SHA-256)
 * @returns Decrypted plain text string (e.g. Gemini API Key)
 */
export async function decryptGeminiApiKeyGcm(
  encryptedPayload: string,
  secret: string = DEFAULT_GEMINI_SECRET
): Promise<string> {
  if (!encryptedPayload || typeof encryptedPayload !== 'string') {
    throw new Error('[CryptoUtil] Encrypted payload must be a non-empty string.');
  }

  const trimmed = encryptedPayload.trim();

  // If already unencrypted plain API key (starts with AIzaSy / AQ. or no colon separator)
  if (trimmed.startsWith('AIzaSy') || trimmed.startsWith('AQ.') || !trimmed.includes(':')) {
    return trimmed;
  }

  // 1. Validate payload format
  const validation = validateEncryptedPayload(trimmed);
  if (!validation.isValid) {
    throw new Error(`[CryptoUtil] Payload validation failed: ${validation.error}`);
  }

  const subtle = getWebCryptoSubtle();

  // Method A: Native Web Crypto API (supported in Web browsers & Node.js)
  if (subtle) {
    try {
      const ivBytes = hexToBytes(validation.ivHex);
      const cipherAndTagBytes = hexToBytes(validation.cipherAndTagHex);
      const cryptoKey = await deriveAesGcmKey(secret);

      const decryptedBuffer = await subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBytes as unknown as BufferSource,
          tagLength: 128, // 128-bit authentication tag
        },
        cryptoKey,
        cipherAndTagBytes as unknown as BufferSource
      );

      const decryptedText = new TextDecoder().decode(decryptedBuffer);
      if (decryptedText && decryptedText.length > 5) {
        return decryptedText;
      }
    } catch (webCryptoErr: any) {
      console.warn('[CryptoUtil] Native WebCrypto failed, trying universal engine:', webCryptoErr?.message);
    }
  }

  // Method B: Universal AES-256-GCM keystream decryption for React Native (Hermes engine)
  // In AES-GCM specification, the plaintext is encrypted with AES-CTR using a 16-byte initial counter block:
  // [12-byte IV] + [0, 0, 0, 2] (32 hex characters total).
  // The authentication tag is the trailing 16 bytes (32 hex characters) of cipherAndTagHex.
  try {
    const ivHex = validation.ivHex;
    const cipherAndTagHex = validation.cipherAndTagHex;
    const encHex = cipherAndTagHex.slice(0, -32); // strip the trailing 128-bit tag
    const initialCounterHex = ivHex + '00000002'; // standard 16-byte GCM CTR counter block

    const keySha = CryptoJS.SHA256(secret);
    const ivWordArray = CryptoJS.enc.Hex.parse(initialCounterHex);
    const ciphertextWordArray = CryptoJS.enc.Hex.parse(encHex);

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertextWordArray } as any,
      keySha as any,
      {
        iv: ivWordArray,
        mode: CryptoJS.mode.CTR,
        padding: CryptoJS.pad.NoPadding,
      }
    );

    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    if (plainText && plainText.length > 5 && /^[\x20-\x7E]+$/.test(plainText)) {
      return plainText.trim();
    }
  } catch (err: any) {
    // Continue to error throw below
  }

  throw new Error('[CryptoUtil] AES-256-GCM decryption failed (invalid key or corrupted payload).');
}
