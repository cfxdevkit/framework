import { AES_KEY_LEN } from './constants.js';
import { CryptoError } from './errors.js';
import { randomBytes } from './random.js';

/**
 * Branded 32-byte AES-256 key. Construct via {@link generateAesGcmKey},
 * {@link deriveKeyArgon2id} or {@link deriveKeyHkdf}.
 */
export type AesGcmKey = Uint8Array & { readonly __brand: 'AesGcmKey' };

export function brandKey(bytes: Uint8Array): AesGcmKey {
  if (bytes.length !== AES_KEY_LEN) {
    throw new CryptoError({
      code: 'services/crypto/bad-key',
      message: `AES-GCM key must be ${AES_KEY_LEN} bytes (got ${bytes.length})`,
    });
  }
  return bytes as AesGcmKey;
}

/** Generate a fresh 256-bit AES-GCM key from the platform CSPRNG. */
export function generateAesGcmKey(): AesGcmKey {
  return brandKey(randomBytes(AES_KEY_LEN));
}
