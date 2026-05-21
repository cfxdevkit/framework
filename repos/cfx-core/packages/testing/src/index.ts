import type { Client, CoreLog, CoreLogFilter, TxReceipt } from '@cfxdevkit/cdk';
import { createDevNode, type DevNode } from '@cfxdevkit/devnode';

export const __packageName = '@cfxdevkit/testing' as const;

export interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T | PromiseLike<T>): void;
  reject(error: unknown): void;
}

export interface MockClientOptions {
  family?: 'core' | 'espace';
  chainId?: number;
  receipts?: Map<string, TxReceipt | null>;
  logs?: CoreLog[];
  request?: (method: string, params: readonly unknown[]) => unknown | Promise<unknown>;
}

export interface DevNodeFixtureOptions {
  mnemonic?: string;
  dataDir?: string;
  accounts?: number;
  logging?: boolean;
  autoStart?: boolean;
}

export function createDeferred<T>(): Deferred<T> {
  let resolve!: Deferred<T>['resolve'];
  let reject!: Deferred<T>['reject'];
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

export async function waitFor(
  assertion: () => boolean | Promise<boolean>,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 1_000;
  const intervalMs = options.intervalMs ?? 25;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() <= deadline) {
    if (await assertion()) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`condition was not met within ${timeoutMs}ms`);
}

export function createMockClient(options: MockClientOptions = {}): Client {
  const family = options.family ?? 'espace';
  const chain = {
    id: options.chainId ?? (family === 'core' ? 2029 : 2030),
    name: family === 'core' ? 'mock-core' : 'mock-espace',
    family,
    displayName: family === 'core' ? 'Mock Core' : 'Mock eSpace',
    network: 'local',
    nativeToken: { symbol: 'CFX', decimals: 18 },
    rpc: { http: ['http://mock.local'] },
  } as const;

  const base = {
    chain,
    transport: {} as never,
    request: async <T = unknown>(req: { method: string; params?: readonly unknown[] }) =>
      (options.request ? options.request(req.method, req.params ?? []) : null) as T,
  };

  if (family === 'core') {
    return {
      ...base,
      family: 'core',
      getEpochNumber: async () => 0n,
      getStatus: async () => ({ chainId: chain.id, networkId: chain.id }) as never,
      getBalance: async () => 0n,
      getTransactionReceipt: async (hash) => options.receipts?.get(hash) ?? null,
      getTransaction: async () => null,
      getLogs: async (_filter: CoreLogFilter) => options.logs ?? [],
      getSponsorInfo: async () => ({}) as never,
      getAdmin: async () => null,
      getTransactionCount: async () => 0,
      getGasPrice: async () => 0n,
      sendRawTransaction: async () => '0x' as `0x${string}`,
    };
  }

  return {
    ...base,
    family: 'espace',
    getBlockNumber: async () => 0n,
    getBlock: async () => ({}) as never,
    getBalance: async () => 0n,
    getTransactionReceipt: async (hash) => options.receipts?.get(hash) ?? null,
    getTransaction: async () => null,
    getTransactionCount: async () => 0,
    getGasPrice: async () => 0n,
    sendRawTransaction: async () => '0x' as `0x${string}`,
    estimateGas: async () => 21_000n,
  };
}

export async function createDevNodeFixture(options: DevNodeFixtureOptions = {}): Promise<DevNode> {
  const node = createDevNode(options);
  if (options.autoStart) await node.start();
  return node;
}
