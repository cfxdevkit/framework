import { describe, expect, it } from 'vitest';
import { coreSpaceTestnet, espaceTestnet } from '../chains/index.js';
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

  it('createClient produces an eSpace client without performing I/O', () => {
    const client = createClient({ chain: espaceTestnet, transport: http() });
    expect(client.family).toBe('espace');
    expect(client.chain).toBe(espaceTestnet);
    if (client.family === 'espace') {
      expect(typeof client.getBlockNumber).toBe('function');
    }
  });

  it('createClient produces a Core Space client without performing I/O', () => {
    const client = createClient({ chain: coreSpaceTestnet, transport: http() });
    expect(client.family).toBe('core');
    expect(client.chain).toBe(coreSpaceTestnet);
    if (client.family === 'core') {
      expect(typeof client.getEpochNumber).toBe('function');
      expect(typeof client.getStatus).toBe('function');
      expect(typeof client.getTransactionReceipt).toBe('function');
      expect(typeof client.getTransaction).toBe('function');
      expect(typeof client.getLogs).toBe('function');
      expect(typeof client.getSponsorInfo).toBe('function');
      expect(typeof client.getAdmin).toBe('function');
    }
  });
});

describe.skipIf(!RUN_NETWORK)('client / network smoke (eSpace testnet)', () => {
  const client = createClient({ chain: espaceTestnet, transport: http() });
  if (client.family !== 'espace') throw new Error('expected eSpace client');
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

describe.skipIf(!RUN_NETWORK)('client / network smoke (Core Space testnet)', () => {
  const client = createClient({ chain: coreSpaceTestnet, transport: http() });
  if (client.family !== 'core') throw new Error('expected Core Space client');

  it('getEpochNumber returns a positive bigint', async () => {
    const n = await client.getEpochNumber();
    expect(typeof n).toBe('bigint');
    expect(n).toBeGreaterThan(0n);
  }, 30_000);

  it('getStatus returns a populated NodeStatus', async () => {
    const status = await client.getStatus();
    expect(status.chainId).toBe(coreSpaceTestnet.id);
    expect(typeof status.epochNumber).toBe('bigint');
    expect(status.epochNumber).toBeGreaterThan(0n);
    expect(status.bestHash).toMatch(/^0x[0-9a-f]{64}$/i);
  }, 30_000);

  it('getEpochNumber("latest_finalized") <= getEpochNumber("latest_state")', async () => {
    const [finalized, state] = await Promise.all([
      client.getEpochNumber({ epochTag: 'latest_finalized' }),
      client.getEpochNumber({ epochTag: 'latest_state' }),
    ]);
    expect(finalized).toBeLessThanOrEqual(state);
  }, 30_000);
});
