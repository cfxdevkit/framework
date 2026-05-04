import { randomBytes as nobleRandomBytes } from '@noble/hashes/utils';
import { CryptoError } from './errors.js';

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
