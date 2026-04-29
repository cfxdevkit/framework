/**
 * `@cfxdevkit/services/crypto` — AEAD + KDF + CSPRNG primitives.
 *
 * Thin wrappers over `@noble/ciphers` (AES-256-GCM) and `@noble/hashes`
 * (Argon2id, HKDF). Errors normalize to `CryptoError` with codes
 * `services/crypto/{decrypt-failed,bad-key}`.
 */

import type { Hex } from '@cfxdevkit/core';
import { CfxError } from '@cfxdevkit/core';
import { gcm } from '@noble/ciphers/aes';
import { argon2idAsync } from '@noble/hashes/argon2';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';
import { randomBytes as nobleRandomBytes } from '@noble/hashes/utils';

/** Keystore/crypto failures. */
export class CryptoError extends CfxError {}

/**
 * Branded 32-byte AES-256 key. Construct via {@link generateAesGcmKey},
 * {@link deriveKeyArgon2id} or {@link deriveKeyHkdf}.
 */
export type AesGcmKey = Uint8Array & { readonly __brand: 'AesGcmKey' };

const AES_KEY_LEN = 32;
const GCM_IV_LEN = 12;
const GCM_TAG_LEN = 16;

function brandKey(bytes: Uint8Array): AesGcmKey {
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
  return brandKey(nobleRandomBytes(AES_KEY_LEN));
}

/** N bytes of cryptographically-secure randomness. */
export function randomBytes(n: number): Uint8Array {
  if (!Number.isInteger(n) || n < 0) {
    throw new CryptoError({
      code: 'services/crypto/bad-key',
      message: 'randomBytes(n): n must be a non-negative integer',
    });
  }
  return nobleRandomBytes(n);
}

// ── AES-256-GCM ──────────────────────────────────────────────────────────────

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
  // noble appends the 16-byte tag to the ciphertext — split for the API.
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

// ── KDFs ────────────────────────────────────────────────────────────────────

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

// ── Encoding ────────────────────────────────────────────────────────────────

const HEX = '0123456789abcdef';

/** Bytes → 0x-prefixed hex. */
export function toHex(bytes: Uint8Array): Hex {
  let s = '0x';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] ?? 0;
    s += (HEX[(b >> 4) & 0x0f] ?? '0') + (HEX[b & 0x0f] ?? '0');
  }
  return s as Hex;
}

/** 0x-prefixed hex → bytes. Throws on malformed input. */
export function fromHex(hex: Hex): Uint8Array {
  if (typeof hex !== 'string' || !hex.startsWith('0x') || hex.length % 2 !== 0) {
    throw new CryptoError({
      code: 'services/crypto/bad-key',
      message: 'fromHex: expected 0x-prefixed even-length hex string',
    });
  }
  const out = new Uint8Array((hex.length - 2) / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = Number.parseInt(hex.slice(2 + i * 2, 4 + i * 2), 16);
    if (Number.isNaN(byte)) {
      throw new CryptoError({
        code: 'services/crypto/bad-key',
        message: `fromHex: invalid hex at offset ${i * 2}`,
      });
    }
    out[i] = byte;
  }
  return out;
}

/** Bytes → URL-safe base64 (RFC 4648 §5, no padding). */
export function toBase64Url(bytes: Uint8Array): string {
  // Build a binary string then base64-encode it; small enough for keystore use.
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] ?? 0);
  const b64 = typeof btoa === 'function' ? btoa(bin) : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** URL-safe base64 → bytes. */
export function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  if (typeof atob === 'function') {
    const bin = atob(padded + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(padded + pad, 'base64'));
}
