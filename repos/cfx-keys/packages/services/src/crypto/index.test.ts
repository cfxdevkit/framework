import { describe, expect, it } from 'vitest';
import {
  CryptoError,
  decryptAesGcm,
  deriveKeyArgon2id,
  deriveKeyHkdf,
  encryptAesGcm,
  fromBase64Url,
  fromHex,
  generateAesGcmKey,
  randomBytes,
  toBase64Url,
  toHex,
} from './index.js';

describe('AES-256-GCM', () => {
  it('roundtrips plaintext', async () => {
    const key = generateAesGcmKey();
    const plaintext = new TextEncoder().encode('hello world');
    const sealed = await encryptAesGcm({ key, plaintext });
    expect(sealed.iv).toHaveLength(12);
    expect(sealed.tag).toHaveLength(16);
    const out = await decryptAesGcm({ key, ...sealed });
    expect(new TextDecoder().decode(out)).toBe('hello world');
  });

  it('honors AAD: tampering AAD breaks decryption', async () => {
    const key = generateAesGcmKey();
    const aad = new TextEncoder().encode('context-1');
    const sealed = await encryptAesGcm({
      key,
      plaintext: new Uint8Array([1, 2, 3]),
      aad,
    });
    await expect(
      decryptAesGcm({ key, ...sealed, aad: new TextEncoder().encode('context-2') }),
    ).rejects.toBeInstanceOf(CryptoError);
  });

  it('rejects tampered ciphertext', async () => {
    const key = generateAesGcmKey();
    const sealed = await encryptAesGcm({ key, plaintext: new Uint8Array([9, 9, 9]) });
    sealed.ciphertext[0] = (sealed.ciphertext[0] ?? 0) ^ 0xff;
    await expect(decryptAesGcm({ key, ...sealed })).rejects.toBeInstanceOf(CryptoError);
  });
});

describe('KDFs', () => {
  it('deriveKeyArgon2id is deterministic for fixed salt+passphrase', async () => {
    const salt = new Uint8Array(16).fill(7);
    const a = await deriveKeyArgon2id({
      passphrase: 'correct horse battery staple',
      salt,
      memKiB: 1024,
      iterations: 1,
    });
    const b = await deriveKeyArgon2id({
      passphrase: 'correct horse battery staple',
      salt,
      memKiB: 1024,
      iterations: 1,
    });
    expect(a).toEqual(b);
    expect(a).toHaveLength(32);
  });

  it('deriveKeyArgon2id rejects short salt', async () => {
    await expect(
      deriveKeyArgon2id({ passphrase: 'x', salt: new Uint8Array(4) }),
    ).rejects.toBeInstanceOf(CryptoError);
  });

  it('deriveKeyHkdf produces requested length', async () => {
    const out = await deriveKeyHkdf({
      ikm: new Uint8Array(32).fill(1),
      info: new TextEncoder().encode('test'),
      length: 48,
    });
    expect(out).toHaveLength(48);
  });
});

describe('encoding', () => {
  it('toHex / fromHex roundtrip', () => {
    const bytes = new Uint8Array([0, 1, 2, 0xab, 0xff]);
    const hex = toHex(bytes);
    expect(hex).toBe('0x000102abff');
    expect(fromHex(hex)).toEqual(bytes);
  });

  it('fromHex rejects malformed input', () => {
    expect(() => fromHex('abc' as `0x${string}`)).toThrow(CryptoError);
    expect(() => fromHex('0xZZ' as `0x${string}`)).toThrow(CryptoError);
  });

  it('toBase64Url / fromBase64Url roundtrip and avoid + / = chars', () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0xfd, 0xfc, 0xfb]);
    const b64 = toBase64Url(bytes);
    expect(b64).not.toMatch(/[+/=]/);
    expect(fromBase64Url(b64)).toEqual(bytes);
  });

  it('randomBytes produces requested length and varies', () => {
    const a = randomBytes(32);
    const b = randomBytes(32);
    expect(a).toHaveLength(32);
    expect(a).not.toEqual(b);
  });
});
