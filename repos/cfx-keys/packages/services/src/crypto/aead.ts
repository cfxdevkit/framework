import { gcm } from '@noble/ciphers/aes';
import { GCM_IV_LEN, GCM_TAG_LEN } from './constants.js';
import { CryptoError } from './errors.js';
import type { AesGcmKey } from './keys.js';
import { randomBytes } from './random.js';

export interface EncryptInput {
  key: AesGcmKey;
  plaintext: Uint8Array;
  /** Additional Authenticated Data (not encrypted, but bound to the tag). */
  aad?: Uint8Array;
  /** Optional explicit IV (12 bytes). Generated randomly when omitted. */
  iv?: Uint8Array;
}

export interface EncryptOutput {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  /** 16-byte GCM authentication tag. Stored separately for clarity. */
  tag: Uint8Array;
}

/**
 * AES-256-GCM encrypt. Output `ciphertext` is the raw encrypted payload (no
 * tag suffix); the `tag` is returned separately.
 */
export async function encryptAesGcm(input: EncryptInput): Promise<EncryptOutput> {
  const iv = input.iv ?? randomBytes(GCM_IV_LEN);
  if (iv.length !== GCM_IV_LEN) {
    throw new CryptoError({
      code: 'services/crypto/bad-key',
      message: `GCM IV must be ${GCM_IV_LEN} bytes (got ${iv.length})`,
    });
  }
  const cipher = gcm(input.key, iv, input.aad);
  const sealed = cipher.encrypt(input.plaintext);
  if (sealed.length < GCM_TAG_LEN) {
    throw new CryptoError({
      code: 'services/crypto/decrypt-failed',
      message: 'unexpected GCM output length',
    });
  }
  const ciphertext = sealed.subarray(0, sealed.length - GCM_TAG_LEN);
  const tag = sealed.subarray(sealed.length - GCM_TAG_LEN);
  return { ciphertext, iv, tag };
}

export interface DecryptInput {
  key: AesGcmKey;
  ciphertext: Uint8Array;
  iv: Uint8Array;
  tag: Uint8Array;
  aad?: Uint8Array;
}

/** AES-256-GCM decrypt. Throws `CryptoError(decrypt-failed)` on tag mismatch. */
export async function decryptAesGcm(input: DecryptInput): Promise<Uint8Array> {
  if (input.tag.length !== GCM_TAG_LEN) {
    throw new CryptoError({
      code: 'services/crypto/decrypt-failed',
      message: `GCM tag must be ${GCM_TAG_LEN} bytes`,
    });
  }
  const sealed = new Uint8Array(input.ciphertext.length + input.tag.length);
  sealed.set(input.ciphertext, 0);
  sealed.set(input.tag, input.ciphertext.length);
  try {
    const cipher = gcm(input.key, input.iv, input.aad);
    return cipher.decrypt(sealed);
  } catch (cause) {
    throw new CryptoError({
      code: 'services/crypto/decrypt-failed',
      message: 'AES-GCM decryption failed (tag mismatch or corrupt input)',
      cause,
    });
  }
}
