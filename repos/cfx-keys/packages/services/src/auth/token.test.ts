import { describe, expect, it } from 'vitest';
import { readBearerToken, signSessionToken, verifySessionToken } from './token.js';

describe('session token helpers', () => {
  it('signs and verifies a session token', () => {
    const now = () => 1_700_000_000_000;
    const token = signSessionToken('0xAbC', {
      secret: 'secret',
      ttlMs: 1_000,
      now,
      claims: { role: 'admin' },
    });
    expect(verifySessionToken(token, { secret: 'secret', now })).toEqual({
      address: '0xabc',
      issuedAt: 1_700_000_000_000,
      expiresAt: 1_700_000_001_000,
      claims: { role: 'admin' },
    });
  });

  it('rejects tampered or expired tokens', () => {
    const token = signSessionToken('0xabc', {
      secret: 'secret',
      ttlMs: 1,
      now: () => 10,
    });
    expect(verifySessionToken(`${token}x`, { secret: 'secret', now: () => 10 })).toBeNull();
    expect(verifySessionToken(token, { secret: 'secret', now: () => 12 })).toBeNull();
  });

  it('extracts bearer tokens from authorization headers', () => {
    expect(readBearerToken('Bearer abc')).toBe('abc');
    expect(readBearerToken('Basic abc')).toBeNull();
  });
});
