const NONCE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export interface GenerateSiweNonceOptions {
  length?: number;
}

export function generateSiweNonce(options: GenerateSiweNonceOptions = {}): string {
  const length = options.length ?? 17;
  if (!Number.isInteger(length) || length < 8) throw new Error('SIWE nonce length must be >= 8');
  const values = new Uint8Array(length);
  cryptoProvider().getRandomValues(values);
  return Array.from(values, (value) => NONCE_ALPHABET[value % NONCE_ALPHABET.length]).join('');
}

function cryptoProvider(): Crypto {
  if (typeof globalThis.crypto?.getRandomValues === 'function') return globalThis.crypto;
  throw new Error('A Web Crypto compatible random source is required to generate SIWE nonces');
}
