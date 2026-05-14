import { argon2idAsync } from '@noble/hashes/argon2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { AES_KEY_LEN } from './constants.js';
import { CryptoError } from './errors.js';
import { type AesGcmKey, brandKey } from './keys.js';

export interface Argon2idInput {
  passphrase: string;
  salt: Uint8Array;
  /** Memory cost in KiB. Default 64 MiB. */
  memKiB?: number;
  /** Time cost (iterations). Default 3. */
  iterations?: number;
  /** Parallelism / lanes. Default 1. */
  parallelism?: number;
}

/** Derive a 32-byte AES key from a passphrase via Argon2id (RFC 9106 defaults). */
export async function deriveKeyArgon2id(input: Argon2idInput): Promise<AesGcmKey> {
  const memKiB = input.memKiB ?? 64 * 1024;
  const iterations = input.iterations ?? 3;
  const parallelism = input.parallelism ?? 1;
  if (input.salt.length < 8) {
    throw new CryptoError({
      code: 'services/crypto/bad-key',
      message: 'Argon2id salt must be at least 8 bytes',
    });
  }
  const out = await argon2idAsync(input.passphrase, input.salt, {
    t: iterations,
    m: memKiB,
    p: parallelism,
    dkLen: AES_KEY_LEN,
  });
  return brandKey(out);
}

export interface HkdfInput {
  ikm: Uint8Array;
  salt?: Uint8Array;
  info?: Uint8Array;
  /** Output length in bytes. Default 32. */
  length?: number;
}

/** HKDF-SHA256. Synchronous under the hood; promised for API uniformity. */
export async function deriveKeyHkdf(input: HkdfInput): Promise<Uint8Array> {
  const length = input.length ?? AES_KEY_LEN;
  return hkdf(sha256, input.ikm, input.salt, input.info, length);
}
