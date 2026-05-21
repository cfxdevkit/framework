import type { EspaceClient, Hex, SignableTx, Signer, TxReceipt } from '@cfxdevkit/cdk';
import { encodeAbiParameters, encodeEventTopics, encodeFunctionResult } from 'viem';
import { describe, expect, it } from 'vitest';
import { limitOrderJob, OWNER } from '../testHelpers.js';
import { AUTOMATION_MANAGER_ABI, KeeperClientImpl } from './client.js';

const CONTRACT = '0x00000000000000000000000000000000000000aa' as const;
const ROUTER = '0x00000000000000000000000000000000000000bb' as const;
const JOB_ID = `0x${'1'.repeat(64)}` as const;

describe('KeeperClientImpl', () => {
  it('maps on-chain job status values', async () => {
    const client = new KeeperClientImpl({
      client: mockEspaceClient({
        eth_call: encodeFunctionResult({
          abi: AUTOMATION_MANAGER_ABI,
          functionName: 'getJob',
          result: [JOB_ID, OWNER, 0, 1, 0n, 0n, 100n],
        }),
      }),
      signer: mockSigner(),
      contractAddress: CONTRACT,
      swappiRouter: ROUTER,
    });

    await expect(client.getOnChainStatus(JOB_ID)).resolves.toBe('executed');
  });

  it('executes AutomationManager limit orders through signed raw transactions', async () => {
    const calls: string[] = [];
    const signed: SignableTx[] = [];
    const client = mockEspaceClient(
      {
        eth_call: encodeFunctionResult({
          abi: AUTOMATION_MANAGER_ABI,
          functionName: 'paused',
          result: false,
        }),
      },
      calls,
    );
    const keeper = new KeeperClientImpl({
      client,
      signer: mockSigner(signed),
      contractAddress: CONTRACT,
      swappiRouter: ROUTER,
      receiptIntervalMs: 0,
    });

    const result = await keeper.executeLimitOrder(limitOrderJob({ onChainJobId: JOB_ID }));

    expect(result.txHash).toBe('0xhash');
    expect(calls).toContain('eth_call');
    expect(calls).toContain('eth_getTransactionCount');
    expect(signed).toHaveLength(1);
    expect(signed[0]).toMatchObject({ chainId: 71, to: CONTRACT, family: 'espace' });
    expect(signed[0]?.data).toMatch(/^0x[0-9a-f]+$/i);
    expect(signed[0]?.data).toContain(JOB_ID.slice(2));
  });
});

function mockEspaceClient(rpc: Record<string, Hex>, calls: string[] = []): EspaceClient {
  return {
    family: 'espace',
    chain: {
      id: 71,
      name: 'mock-espace',
      displayName: 'Mock eSpace',
      network: 'testnet',
      family: 'espace',
      nativeToken: { symbol: 'CFX', decimals: 18 },
      rpc: { http: ['http://localhost:8545'] },
    },
    transport: { kind: 'http' } as never,
    async request(req) {
      calls.push(req.method);
      if (req.method === 'eth_getTransactionCount') return '0x0' as never;
      const value = rpc[req.method];
      if (value !== undefined) return value as never;
      throw new Error(`unhandled RPC ${req.method}`);
    },
    async getBlockNumber() {
      return 1n;
    },
    async getBlock() {
      return { baseFeePerGas: 1_000_000_000n } as never;
    },
    async getBalance() {
      return 0n;
    },
    async getTransaction() {
      return null;
    },
    async getTransactionReceipt() {
      return {
        status: 'success',
        logs: [
          {
            topics: encodeEventTopics({
              abi: [
                {
                  type: 'event',
                  name: 'Transfer',
                  inputs: [
                    { indexed: true, name: 'from', type: 'address' },
                    { indexed: true, name: 'to', type: 'address' },
                    { indexed: false, name: 'value', type: 'uint256' },
                  ],
                },
              ],
              eventName: 'Transfer',
              args: { from: ROUTER, to: OWNER },
            }),
            data: encodeAbiParameters([{ type: 'uint256' }], [123n]),
          },
        ],
      } as unknown as TxReceipt;
    },
    async getTransactionCount() {
      return 0;
    },
    async getGasPrice() {
      return 1_000_000_000n;
    },
    async estimateGas() {
      return 123_456n;
    },
    async sendRawTransaction() {
      return '0xhash';
    },
  } as EspaceClient;
}

function mockSigner(history: SignableTx[] = []): Signer {
  return {
    account: { address: OWNER, publicKey: '0x' },
    async signTransaction(tx) {
      history.push(tx);
      return '0xsigned';
    },
    async signMessage() {
      return '0x';
    },
    async signTypedData() {
      return '0x';
    },
  };
}
