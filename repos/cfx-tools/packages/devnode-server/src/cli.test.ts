import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_BASE_URL, DEFAULT_HOST, executeCliCommand, parseArgs } from './cli.js';

describe('devnode-server cli', () => {
  it('parses serve defaults when invoked without an explicit subcommand', () => {
    expect(parseArgs(['--port', '53000'])).toEqual({
      command: 'serve',
      host: DEFAULT_HOST,
      port: 53000,
    });
  });

  it('parses start config flags', () => {
    expect(
      parseArgs([
        'start',
        '--base-url',
        'http://localhost:53000',
        '--accounts',
        '4',
        '--data-dir',
        '/tmp/devnode-a',
        '--logging',
        '--mining-interval',
        '0',
      ]),
    ).toEqual({
      command: 'start',
      baseUrl: 'http://localhost:53000',
      json: false,
      config: {
        accounts: 4,
        dataDir: '/tmp/devnode-a',
        logging: true,
        miningIntervalMs: 0,
      },
    });
  });

  it('collects status from the shared control-plane endpoints', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/health')) return jsonResponse({ ok: true });
      if (url.endsWith('/node/status')) {
        return jsonResponse({ ok: true, node: { status: 'running', running: true } });
      }
      if (url.endsWith('/keystore/status')) {
        return jsonResponse({ ok: true, initialized: true, locked: false, walletCount: 2 });
      }
      return jsonResponse({ ok: false, error: 'unexpected path' }, 404);
    });

    const result = await executeCliCommand(
      { command: 'status', baseUrl: DEFAULT_BASE_URL, json: false },
      { fetchImpl },
    );

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({
      health: { ok: true },
      node: { ok: true, node: { status: 'running', running: true } },
      keystore: { ok: true, initialized: true, locked: false, walletCount: 2 },
    });
  });

  it('posts mine requests to the runtime api', async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(JSON.stringify({ blocks: 3 }));
      return jsonResponse({ ok: true, node: { mining: { ticks: 3 } } });
    });

    const result = await executeCliCommand(
      { command: 'mine', baseUrl: DEFAULT_BASE_URL, json: false, blocks: 3, pack: false },
      { fetchImpl },
    );

    expect(result).toMatchObject({ ok: true, node: { mining: { ticks: 3 } } });
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
