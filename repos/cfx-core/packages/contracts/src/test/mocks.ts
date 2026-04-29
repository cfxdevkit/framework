/**
 * Test fixtures: a minimal in-memory eSpace `Client` and a recording `Signer`
 * to exercise the contracts surface without an RPC endpoint.
 */
import type {
  Address,
  CallOptions,
  ChainConfig,
  Client,
  EspaceClient,
  GetBalanceOptions,
  Hash,
  Hex,
  RpcRequest,
  SignableTx,
  Signer,
  TxReceipt,
  TxRequest,
  Wei,
} from '@cfxdevkit/core';

export interface MockClientOptions {
  family?: 'espace' | 'core';
  chainId?: number;
  /** Map of `method:hash` -> result; used by `request()`. */
  rpc?: Record<string, unknown | ((req: RpcRequest) => unknown)>;
  /** Stub for `estimateGas`. */
  gas?: bigint;
  /** Stub for `getBlock(...).baseFeePerGas`. */
  baseFeePerGas?: bigint;
  /** Receipt to return from `getTransactionReceipt`. */
  receipt?: TxReceipt | null;
}

export function mockChain(id = 71): ChainConfig {
  return {
    family: 'espace',
    id,
    name: 'mock-espace',
    displayName: 'Mock eSpace',
    network: 'testnet',
    nativeToken: { symbol: 'CFX', decimals: 18 },
    rpc: { http: ['http://localhost:8545'] as const },
  } as unknown as ChainConfig;
}

export function makeMockClient(opts: MockClientOptions = {}): Client {
  const chain = mockChain(opts.chainId ?? 71);
  const calls: RpcRequest[] = [];
  if (opts.family === 'core') {
    return {
      family: 'core',
      chain: { ...chain, family: 'core' } as ChainConfig,
      transport: { kind: 'http' } as never,
      __calls: calls,
      request: async <T>(req: RpcRequest, _o?: CallOptions): Promise<T> => {
        calls.push(req);
        const entry = opts.rpc?.[req.method];
        if (typeof entry === 'function') return entry(req) as T;
        if (entry !== undefined) return entry as T;
        throw new Error(`mockClient: unhandled RPC method ${req.method}`);
      },
      getEpochNumber: async () => 0n,
      getStatus: async () =>
        ({
          chainId: 71,
          networkId: 71,
          ethereumSpaceChainId: 71,
          epochNumber: 0n,
          blockNumber: 0n,
          bestHash: '0x' as Hash,
          latestCheckpoint: 0n,
          latestConfirmed: 0n,
          latestFinalized: 0n,
          latestState: 0n,
          pendingTxNumber: 0,
        }) as never,
      getBalance: async (_a: string, _o?: never) => 0n as Wei,
    } as Client;
  }

  const espace: EspaceClient & { __calls: RpcRequest[] } = {
    family: 'espace',
    chain,
    transport: { kind: 'http' } as never,
    __calls: calls,
    request: async <T>(req: RpcRequest, _o?: CallOptions): Promise<T> => {
      calls.push(req);
      const entry = opts.rpc?.[req.method];
      if (typeof entry === 'function') return entry(req) as T;
      if (entry !== undefined) return entry as T;
      throw new Error(`mockClient: unhandled RPC method ${req.method}`);
    },
    getBlockNumber: async (_o?: CallOptions) => 0n,
    getBlock: async (_t, _o?: CallOptions) =>
      ({ baseFeePerGas: opts.baseFeePerGas ?? 1_000_000_000n }) as never,
    getBalance: async (_a: Address, _o?: GetBalanceOptions) => 0n as Wei,
    getTransactionReceipt: async (_h: Hash, _o?: CallOptions) =>
      opts.receipt === undefined ? null : opts.receipt,
    estimateGas: async (_i: TxRequest, _o?: CallOptions) => opts.gas ?? 21_000n,
  };
  return espace;
}

export function getRecordedCalls(client: Client): RpcRequest[] {
  return (client as unknown as { __calls?: RpcRequest[] }).__calls ?? [];
}

export interface MockSignerOptions {
  address?: Address;
  /** What to return from signTransaction. */
  rawTx?: Hex;
  /** Capture each signed tx for assertions. */
  history?: SignableTx[];
}

export function makeMockSigner(opts: MockSignerOptions = {}): Signer & { history: SignableTx[] } {
  const history = opts.history ?? [];
  return {
    account: {
      address: opts.address ?? '0x0000000000000000000000000000000000001234',
      publicKey: '0x',
    },
    history,
    async signTransaction(tx: SignableTx) {
      history.push(tx);
      return opts.rawTx ?? ('0xdeadbeef' as Hex);
    },
    async signMessage() {
      return '0x' as Hex;
    },
    async signTypedData() {
      return '0x' as Hex;
    },
  } as Signer & { history: SignableTx[] };
}
