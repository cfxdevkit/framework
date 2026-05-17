import { afterEach, describe, expect, it } from 'vitest';
import { HttpClient } from './http.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('HttpClient', () => {
  it('binds global fetch to the global object', async () => {
    globalThis.fetch = function (this: unknown) {
      expect(this).toBe(globalThis);
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          headers: { 'content-type': 'application/json' },
          status: 200,
        }),
      );
    } as typeof fetch;

    const client = new HttpClient('/api');

    await expect(client.get<{ ok: boolean }>('/status')).resolves.toEqual({ ok: true });
  });
});
