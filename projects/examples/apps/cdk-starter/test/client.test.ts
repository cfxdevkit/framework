import { describe, expect, it } from 'vitest';
import { createClient, http } from '@cfxdevkit/cdk/client';
import type { EspaceClient, CoreSpaceClient } from '@cfxdevkit/cdk/client';
import { espaceTestnet, coreSpaceTestnet } from '@cfxdevkit/cdk/chains';

describe('client', () => {
  it('creates an eSpace client', () => {
    const client = createClient({
      chain: espaceTestnet,
      transport: http({ url: 'https://evmtestnet.confluxrpc.com' }),
    }) as EspaceClient;
    expect(client.family).toBe('espace');
    expect(client.chain).toBe(espaceTestnet);
    expect(typeof client.getBlockNumber).toBe('function');
    expect(typeof client.getBalance).toBe('function');
  });

  it('creates a Core Space client', () => {
    const client = createClient({
      chain: coreSpaceTestnet,
      transport: http({ url: 'https://test.confluxrpc.com' }),
    }) as CoreSpaceClient;
    expect(client.family).toBe('core');
    expect(client.chain).toBe(coreSpaceTestnet);
    expect(typeof client.getEpochNumber).toBe('function');
    expect(typeof client.getStatus).toBe('function');
  });

  it('exposes request method on both clients', () => {
    const espace = createClient({
      chain: espaceTestnet,
      transport: http({ url: 'https://evmtestnet.confluxrpc.com' }),
    });
    const core = createClient({
      chain: coreSpaceTestnet,
      transport: http({ url: 'https://test.confluxrpc.com' }),
    });
    expect(typeof espace.request).toBe('function');
    expect(typeof core.request).toBe('function');
  });
});
