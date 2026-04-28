import { describe, expect, it } from 'vitest';
import { coreSpaceMainnet, espaceTestnet } from '../chains/index.js';
import { RpcError } from '../errors/index.js';
import { createClient, fallback, http, ws } from './index.js';

const RUN_NETWORK = process.env.RUN_NETWORK_TESTS === '1';

describe('client / offline', () => {
  it('http() builds an opaque transport', () => {
    const t = http();
    expect(t.kind).toBe('http');
  });

  it('ws() builds an opaque transport', () => {
    const t = ws({ url: 'wss://example.invalid' });
    expect(t.kind).toBe('ws');
  });

  it('fallback() requires at least one transport', () => {
    expect(() => fallback([])).toThrow(/at least one/);
  });

  it('fallback() composes transports', () => {
    const t = fallback([http(), http()]);
    expect(t.kind).toBe('fallback');
  });

  it('createClient throws RpcError for Core Space (Phase II)', () => {
    let caught: unknown;
    try {
      createClient({ chain: coreSpaceMainnet, transport: http() });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(RpcError);
    expect((caught as RpcError).code).toBe('core/client/unsupported-family');
  });

  it('createClient produces a Client for eSpace without performing I/O', () => {
    const client = createClient({ chain: espaceTestnet, transport: http() });
    expect(client.chain).toBe(espaceTestnet);
    expect(typeof client.getBlockNumber).toBe('function');
    expect(typeof client.request).toBe('function');
  });
});

describe.skipIf(!RUN_NETWORK)('client / network smoke (eSpace testnet)', () => {
  const client = createClient({ chain: espaceTestnet, transport: http() });
  const ZERO = '0x0000000000000000000000000000000000000000' as const;

  it('getBlockNumber returns a positive bigint', async () => {
    const n = await client.getBlockNumber();
    expect(typeof n).toBe('bigint');
    expect(n).toBeGreaterThan(0n);
  }, 30_000);

  it('getBalance returns a bigint for the zero address', async () => {
    const bal = await client.getBalance(ZERO);
    expect(typeof bal).toBe('bigint');
    expect(bal).toBeGreaterThanOrEqual(0n);
  }, 30_000);

  it('getBlock(latest) returns a block', async () => {
    const block = await client.getBlock('latest');
    expect(block).toBeTruthy();
    expect(typeof block.number).toBe('bigint');
  }, 30_000);
});
