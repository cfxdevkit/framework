import type { Client, TxReceipt } from '@cfxdevkit/cdk';
import { describe, expect, it } from 'vitest';
import {
  __packageName,
  assertSuccessfulReceipt,
  collectLogs,
  estimateTransaction,
  getChainProgress,
  waitForTransactionReceipt,
} from './index.js';

describe('@cfxdevkit/protocol', () => {
  it('exposes its package name', () => {
    expect(__packageName).toBe('@cfxdevkit/protocol');
  });

  it('returns eSpace chain progress', async () => {
    const client = mockEspaceClient({ blockNumber: 42n });
    await expect(getChainProgress(client)).resolves.toEqual({
      family: 'espace',
      chainId: 2030,
      height: 42n,
    });
  });

  it('returns Core Space chain progress', async () => {
    const client = mockCoreClient({ epochNumber: 7n });
    await expect(getChainProgress(client)).resolves.toEqual({
      family: 'core',
      chainId: 2029,
      height: 7n,
    });
  });

  it('waits for receipts', async () => {
    const receipt = { status: 'success' } as TxReceipt;
    let calls = 0;
    const client = mockEspaceClient({
      receipt: () => {
        calls += 1;
        return calls < 2 ? null : receipt;
      },
    });
    await expect(
      waitForTransactionReceipt(client, '0x123' as never, { intervalMs: 0 }),
    ).resolves.toBe(receipt);
  });

  it('throws for reverted receipts', () => {
    expect(() => assertSuccessfulReceipt({ status: '0x1' } as unknown as TxReceipt)).toThrow(
      'reverted',
    );
  });

  it('times out when receipts are not found', async () => {
    const client = mockEspaceClient();
    await expect(
      waitForTransactionReceipt(client, '0x404' as never, { intervalMs: 0, timeoutMs: 0 }),
    ).rejects.toThrow('not found');
  });

  it('estimates eSpace gas', async () => {
    const client = mockEspaceClient({ gas: 44_000n });
    await expect(estimateTransaction(client, {})).resolves.toEqual({ gas: 44_000n });
  });

  it('estimates core gas and collateral', async () => {
    const client = mockCoreClient({ estimate: { gasUsed: '21000', storageCollateralized: '64' } });
    await expect(estimateTransaction(client, {})).resolves.toEqual({
      gas: 21000n,
      storageCollateral: 64n,
    });
  });

  it('collects Core logs and rejects eSpace log collection', async () => {
    const core = mockCoreClient({ logs: [{ address: 'cfx:test' } as never] });
    await expect(collectLogs(core, {})).resolves.toHaveLength(1);
    await expect(collectLogs(mockEspaceClient(), {})).rejects.toThrow('Core Space');
  });
});

function mockEspaceClient(
  input: { blockNumber?: bigint; gas?: bigint; receipt?: () => TxReceipt | null } = {},
): Client {
  return {
    family: 'espace',
    chain: {
      id: 2030,
      name: 'espace-local',
      family: 'espace',
      displayName: 'Local eSpace',
      network: 'local',
      nativeToken: { symbol: 'CFX', decimals: 18 },
      rpc: { http: ['http://localhost'] },
    },
    transport: {} as never,
    request: async () => null,
    getBlockNumber: async () => input.blockNumber ?? 0n,
    getBlock: async () => ({}) as never,
    getBalance: async () => 0n,
    getTransactionReceipt: async () => input.receipt?.() ?? null,
    estimateGas: async () => input.gas ?? 21_000n,
  };
}

function mockCoreClient(
  input: { epochNumber?: bigint; estimate?: unknown; logs?: never[] } = {},
): Client {
  return {
    family: 'core',
    chain: {
      id: 2029,
      name: 'core-local',
      family: 'core',
      displayName: 'Local Core',
      network: 'local',
      nativeToken: { symbol: 'CFX', decimals: 18 },
      rpc: { http: ['http://localhost'] },
    },
    transport: {} as never,
    request: async () => input.estimate,
    getEpochNumber: async () => input.epochNumber ?? 0n,
    getStatus: async () => ({}) as never,
    getBalance: async () => 0n,
    getTransactionReceipt: async () => null,
    getTransaction: async () => null,
    getLogs: async () => input.logs ?? [],
    getSponsorInfo: async () => ({}) as never,
    getAdmin: async () => null,
  };
}
