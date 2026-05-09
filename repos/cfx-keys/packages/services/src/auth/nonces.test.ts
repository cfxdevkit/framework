import { describe, expect, it } from 'vitest';
import { createMemoryNonceStore } from './nonces.js';

describe('MemoryNonceStore', () => {
  it('issues and consumes a nonce exactly once', () => {
    const store = createMemoryNonceStore({ nonceFactory: () => 'nonce-1' });
    expect(store.issue('0xabc')).toBe('nonce-1');
    expect(store.consume('nonce-1', '0xABC')).toBe(true);
    expect(store.consume('nonce-1', '0xabc')).toBe(false);
  });

  it('rejects expired nonces and clears them on read', () => {
    let now = 1000;
    const store = createMemoryNonceStore({
      ttlMs: 10,
      nonceFactory: () => 'nonce-2',
      now: () => now,
    });
    store.issue('0xabc');
    now = 1011;
    expect(store.consume('nonce-2', '0xabc')).toBe(false);
    expect(store.peek('nonce-2')).toBeNull();
  });
});
