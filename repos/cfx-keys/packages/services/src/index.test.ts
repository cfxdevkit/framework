import { describe, expect, it } from 'vitest';
import { __packageName, createMemoryNonceStore, readBearerToken } from './index.js';

describe('@cfxdevkit/services', () => {
  it('exposes its package name', () => {
    expect(__packageName).toBe('@cfxdevkit/services');
  });

  it('re-exports auth helpers from the package root', () => {
    const store = createMemoryNonceStore({ nonceFactory: () => 'nonce-1' });
    expect(store.issue('0xabc')).toBe('nonce-1');
    expect(readBearerToken('Bearer test-token')).toBe('test-token');
  });
});
