import { describe, expect, it } from 'vitest';
import { CasApiClient, type CasApiError } from './client.js';

describe('CasApiClient', () => {
  it('sends bearer tokens and JSON request bodies', async () => {
    const calls: RequestInit[] = [];
    const client = new CasApiClient({
      baseUrl: 'http://localhost:3011/',
      token: 'session-token',
      fetch: async (_input, init) => {
        calls.push(init ?? {});
        return new Response(JSON.stringify({ job: { id: 'job-1' } }), { status: 201 });
      },
    });

    await client.createJob({
      type: 'swap',
      tokenIn: '0x0000000000000000000000000000000000000001',
      tokenOut: '0x0000000000000000000000000000000000000002',
      amountIn: '100',
      minAmountOut: '90',
    });

    const headers = calls[0]?.headers as Headers;
    expect(headers.get('authorization')).toBe('Bearer session-token');
    expect(calls[0]?.body).toContain('"type":"swap"');
  });

  it('builds admin, pools, system and SSE requests', async () => {
    const requests: string[] = [];
    const client = new CasApiClient({
      baseUrl: 'http://localhost:3011/',
      token: 'session-token',
      fetch: async (input) => {
        requests.push(String(input));
        return new Response(
          JSON.stringify({ paused: false, jobs: [], tokens: [], pairs: [], cachedAt: 1 }),
          {
            status: 200,
          },
        );
      },
    });

    await client.adminStatus();
    await client.adminJobs('failed');
    await client.pools();
    await client.systemStatus();

    expect(requests).toEqual([
      'http://localhost:3011/admin/status',
      'http://localhost:3011/admin/jobs?status=failed',
      'http://localhost:3011/pools',
      'http://localhost:3011/system/status',
    ]);
    expect(client.sseUrl()).toBe('http://localhost:3011/sse/jobs?token=session-token');
  });

  it('throws structured API errors', async () => {
    const client = new CasApiClient({
      fetch: async () => new Response(JSON.stringify({ error: 'bad request' }), { status: 400 }),
    });

    await expect(client.health()).rejects.toMatchObject<CasApiError>({
      name: 'CasApiError',
      message: 'bad request',
      status: 400,
    });
  });
});
