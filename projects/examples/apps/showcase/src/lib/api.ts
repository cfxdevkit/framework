/**
 * Frontend client for `@cfxdevkit/example-showcase-backend`.
 * Base URL is taken from `VITE_BACKEND_URL` (defaults to localhost:5174).
 */
const BASE = (import.meta.env?.VITE_BACKEND_URL as string | undefined) ?? 'http://127.0.0.1:5174';

export interface ApiError extends Error {
  status: number;
  body: unknown;
}

async function call<T>(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    signal: signal ?? init.signal ?? null,
  });
  let body: unknown = null;
  const text = await res.text();
  try {
    body = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const err = new Error(
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${res.status}`,
    ) as ApiError;
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body as T;
}

export const api = {
  baseUrl: BASE,
  health: (signal?: AbortSignal) => call<{ ok: boolean; name: string }>('/health', {}, signal),

  authNonce: (address: string, signal?: AbortSignal) =>
    call<{ nonce: string }>(`/auth/nonce?address=${encodeURIComponent(address)}`, {}, signal),
  authVerify: (payload: { message: string; signature: string }, signal?: AbortSignal) =>
    call<{ token: string; address: string }>(
      '/auth/verify',
      { method: 'POST', body: JSON.stringify(payload) },
      signal,
    ),
  authMe: (token: string, signal?: AbortSignal) =>
    call<{ address: string; issuedAt: number; expiresAt: number }>(
      '/auth/me',
      { headers: { Authorization: `Bearer ${token}` } },
      signal,
    ),

  sessionKeyIssue: (
    payload: {
      parentPrivateKey: string;
      capability: {
        chains?: number[];
        contracts?: string[];
        selectors?: string[];
        maxValuePerTx?: string;
        notAfter?: number;
      };
    },
    signal?: AbortSignal,
  ) =>
    call<{
      parent: string;
      session: string;
      attestation: { message: string; signature: string; digest: string };
      capability: Record<string, unknown>;
    }>('/session-key/issue', { method: 'POST', body: JSON.stringify(payload) }, signal),
  sessionKeyVerify: (
    payload: {
      parent: string;
      session: string;
      capability: {
        chains?: number[];
        contracts?: string[];
        selectors?: string[];
        maxValuePerTx?: string;
        notAfter?: number;
      };
      signature: string;
    },
    signal?: AbortSignal,
  ) =>
    call<{ valid: boolean; message: string }>(
      '/session-key/verify',
      { method: 'POST', body: JSON.stringify(payload) },
      signal,
    ),
};
