import { createHmac, timingSafeEqual } from 'node:crypto';

export interface SessionToken {
  address: string;
  issuedAt: number;
  expiresAt: number;
  claims?: Record<string, unknown>;
}

export interface SessionTokenOptions {
  secret: string;
  ttlMs?: number;
  now?: () => number;
  claims?: Record<string, unknown>;
}

export interface VerifySessionTokenOptions {
  secret: string;
  now?: () => number;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function toBase64Url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromBase64Url(value: string): Buffer {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

export function signSessionToken(address: string, options: SessionTokenOptions): string {
  const now = options.now ?? Date.now;
  const payload: SessionToken = {
    address: address.toLowerCase(),
    issuedAt: now(),
    expiresAt: now() + (options.ttlMs ?? DEFAULT_TTL_MS),
    ...(options.claims ? { claims: options.claims } : {}),
  };
  const body = toBase64Url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const mac = toBase64Url(createHmac('sha256', options.secret).update(body).digest());
  return `${body}.${mac}`;
}

export function verifySessionToken(
  token: string,
  options: VerifySessionTokenOptions,
): SessionToken | null {
  const [body, mac, ...rest] = token.split('.');
  if (!body || !mac || rest.length > 0) return null;

  const expected = toBase64Url(createHmac('sha256', options.secret).update(body).digest());
  const actualBuffer = Buffer.from(mac);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(body).toString('utf8')) as SessionToken;
    if ((options.now ?? Date.now)() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readBearerToken(header: string | null | undefined): string | null {
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}
