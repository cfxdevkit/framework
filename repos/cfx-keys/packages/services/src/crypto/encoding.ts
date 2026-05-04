import type { Hex } from '@cfxdevkit/core';
import { CryptoError } from './errors.js';

const HEX = '0123456789abcdef';

/** Bytes -> 0x-prefixed hex. */
export function toHex(bytes: Uint8Array): Hex {
  let s = '0x';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] ?? 0;
    s += (HEX[(b >> 4) & 0x0f] ?? '0') + (HEX[b & 0x0f] ?? '0');
  }
  return s as Hex;
}

/** 0x-prefixed hex -> bytes. Throws on malformed input. */
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

/** Bytes -> URL-safe base64 (RFC 4648 section 5, no padding). */
export function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] ?? 0);
  const b64 = typeof btoa === 'function' ? btoa(bin) : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** URL-safe base64 -> bytes. */
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
