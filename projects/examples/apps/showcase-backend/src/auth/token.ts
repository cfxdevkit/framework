/**
 * Tiny stateless HMAC-signed bearer token. Keeps the dep tree small (no
 * jsonwebtoken). Format: `base64url(payload).base64url(hmacSha256(payload))`.
 *
 * For demo only — production should use a vetted JWT library and a rotating
 * key from a secrets manager.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET = process.env.SHOWCASE_AUTH_SECRET ?? 'dev-only-do-not-ship-in-prod';
const TTL_MS = 24 * 60 * 60 * 1000;

export interface SessionToken {
  address: string;
  issuedAt: number;
  expiresAt: number;
}

function b64u(buf: Buffer): string {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromB64u(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

export function sign(address: string): string {
  const payload: SessionToken = {
    address: address.toLowerCase(),
    issuedAt: Date.now(),
    expiresAt: Date.now() + TTL_MS,
  };
  const head = b64u(Buffer.from(JSON.stringify(payload), 'utf8'));
  const mac = b64u(createHmac('sha256', SECRET).update(head).digest());
  return `${head}.${mac}`;
}

export function verify(token: string): SessionToken | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [head, mac] = parts as [string, string];
  const expected = b64u(createHmac('sha256', SECRET).update(head).digest());
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(fromB64u(head).toString('utf8')) as SessionToken;
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}
