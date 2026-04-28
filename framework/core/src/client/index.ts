/**
 * `@cfxdevkit/core/client` — chain-aware RPC client factory.
 *
 * The factory returns an opaque {@link Client} object — a discriminated union
 * of {@link EspaceClient} and {@link CoreSpaceClient} keyed by `family`.
 * The client has **no signer**, **no chain switching**, and **no caching** —
 * those concerns live in `framework/wallet`, the consumer, and
 * `framework/react` respectively.
 *
 * ### eSpace
 * Backed by `viem`. EVM-compatible: hex addresses, monotonic block numbers.
 *
 * ### Core Space
 * Backed by `cive`. Conflux-native: base32 (`cfx:` / `cfxtest:`) addresses,
 * epoch numbers, GHAST DAG semantics.
 */
import {
  type Transport as CiveTransport,
  fallback as civeFallback,
  http as civeHttp,
  webSocket as civeWebSocket,
  createPublicClient as createCivePublicClient,
} from 'cive';
import {
  getBalance as civeGetBalance,
  getEpochNumber as civeGetEpochNumber,
  getStatus as civeGetStatus,
} from 'cive/actions';
import { defineChain as civeDefineChain } from 'cive/utils';
import {
  createPublicClient,
  type Chain as ViemChain,
  type Transport as ViemTransport,
  defineChain as viemDefineChain,
  fallback as viemFallback,
  http as viemHttp,
  webSocket as viemWebSocket,
} from 'viem';
import type { ChainConfig } from '../chains/index.js';
import { CfxError, RpcError } from '../errors/index.js';
import type {
  Address,
  Block,
  BlockTag,
  EpochTag,
  Hash,
  NodeStatus,
  TxReceipt,
  TxRequest,
  Wei,
} from '../types/index.js';

// ── Transport ────────────────────────────────────────────────────────────────

/**
 * Opaque transport descriptor. Created via {@link http}, {@link ws}, or
 * {@link fallback}; consumed by {@link createClient}.
 *
 * The internal handles work for both viem (eSpace) and cive (Core Space)
 * because cive re-exports viem's transport primitives.
 */
export interface Transport {
  readonly kind: 'http' | 'ws' | 'fallback';
  /** @internal */
  readonly _viem: ViemTransport;
  /** @internal */
  readonly _cive: CiveTransport;
}

export interface HttpTransportOptions {
  /** Override the URL (otherwise uses the chain's default RPC). */
  url?: string;
  /** Extra HTTP headers (e.g. for an API gateway). */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds. */
  timeoutMs?: number;
  /** Retry attempts for transient failures (default: 0). */
  retries?: number;
}

/** HTTP JSON-RPC transport. Pass `url` to override the chain default. */
export function http(opts: HttpTransportOptions = {}): Transport {
  const { url, headers, timeoutMs, retries } = opts;
  const viemOpts: Parameters<typeof viemHttp>[1] = {};
  if (headers !== undefined) {
    viemOpts.fetchOptions = { headers };
  }
  if (timeoutMs !== undefined) {
    viemOpts.timeout = timeoutMs;
  }
  if (retries !== undefined) {
    viemOpts.retryCount = retries;
  }
  return {
    kind: 'http',
    _viem: viemHttp(url, viemOpts),
    _cive: civeHttp(url, viemOpts),
  };
}

export interface WsTransportOptions {
  url?: string;
  reconnect?: boolean;
  timeoutMs?: number;
}

/** WebSocket JSON-RPC transport. */
export function ws(opts: WsTransportOptions = {}): Transport {
  const { url, reconnect, timeoutMs } = opts;
  const viemOpts: Parameters<typeof viemWebSocket>[1] = {};
  if (reconnect !== undefined) {
    viemOpts.reconnect = reconnect;
  }
  if (timeoutMs !== undefined) {
    viemOpts.timeout = timeoutMs;
  }
  return {
    kind: 'ws',
    _viem: viemWebSocket(url, viemOpts),
    _cive: civeWebSocket(url, viemOpts),
  };
}

/** Fallback combinator: tries each transport in order until one succeeds. */
export function fallback(transports: readonly Transport[]): Transport {
  if (transports.length === 0) {
    throw new CfxError({
      code: 'core/client/invalid-transport',
      message: 'fallback() requires at least one transport',
    });
  }
  return {
    kind: 'fallback',
    _viem: viemFallback(transports.map((t) => t._viem)),
    _cive: civeFallback(transports.map((t) => t._cive)),
  };
}

// ── Client ───────────────────────────────────────────────────────────────────

/** RPC request envelope (JSON-RPC method + params). */
export interface RpcRequest {
  method: string;
  params?: readonly unknown[];
}

/** Per-call options. */
export interface CallOptions {
  signal?: AbortSignal;
}

/** Options for eSpace `getBalance`. */
export interface GetBalanceOptions extends CallOptions {
  blockTag?: BlockTag;
}

/** Options for Core Space epoch-scoped reads. */
export interface CoreCallOptions extends CallOptions {
  epochTag?: Exclude<EpochTag, 'latest_confirmed'>;
}

/** Common members of every {@link Client}. */
interface ClientBase {
  readonly chain: ChainConfig;
  readonly transport: Transport;
  /** Generic JSON-RPC request. Prefer the typed methods when available. */
  request<T = unknown>(req: RpcRequest, opts?: CallOptions): Promise<T>;
}

/** eSpace (EVM) chain client. Discriminated by `family === 'espace'`. */
export interface EspaceClient extends ClientBase {
  readonly family: 'espace';

  /** Latest block number. */
  getBlockNumber(opts?: CallOptions): Promise<bigint>;

  /** Block by tag (`'latest'`, `'pending'`, hex hash, or bigint number). */
  getBlock(tag: BlockTag, opts?: CallOptions): Promise<Block>;

  /** Native-token balance (in wei) for a 0x-prefixed hex address. */
  getBalance(address: Address, opts?: GetBalanceOptions): Promise<Wei>;

  /** Receipt for a mined transaction; `null` if unknown. */
  getTransactionReceipt(hash: Hash, opts?: CallOptions): Promise<TxReceipt | null>;

  /** Estimate gas for an unsigned transaction request. */
  estimateGas(input: TxRequest, opts?: CallOptions): Promise<bigint>;
}

/**
 * Core Space (Conflux-native) chain client. Discriminated by
 * `family === 'core'`. Addresses are base32 strings (`cfx:…` /
 * `cfxtest:…`); progress is measured in epochs, not blocks.
 */
export interface CoreSpaceClient extends ClientBase {
  readonly family: 'core';

  /** Latest epoch number for the given tag (default `'latest_state'`). */
  getEpochNumber(opts?: CoreCallOptions): Promise<bigint>;

  /** Full chain status snapshot (chain id, epoch number, best hash, …). */
  getStatus(opts?: CallOptions): Promise<NodeStatus>;

  /** Native-token balance (in drip) for a base32 Core Space address. */
  getBalance(address: string, opts?: CoreCallOptions): Promise<Wei>;
}

/** Discriminated union of all chain clients. Narrow with `client.family`. */
export type Client = EspaceClient | CoreSpaceClient;

export interface CreateClientInput {
  chain: ChainConfig;
  transport: Transport;
}

/**
 * Build a {@link Client} for the given chain + transport. The returned
 * client's static type is the union {@link Client}; narrow it with
 * `client.family` to access family-specific methods.
 */
export function createClient(input: CreateClientInput): Client {
  const { chain, transport } = input;
  return chain.family === 'core'
    ? createCoreClient(chain, transport)
    : createEspaceClient(chain, transport);
}

// ── Shared error wrapping ────────────────────────────────────────────────────

function wrapRpc<T>(promise: Promise<T>, code: string, meta?: Record<string, unknown>): Promise<T> {
  return promise.catch((cause) => {
    if (cause instanceof CfxError) throw cause;
    throw new RpcError({
      code,
      message: cause instanceof Error ? cause.message : String(cause),
      cause,
      ...(meta ? { meta } : {}),
    });
  });
}

// ── eSpace (viem-backed) implementation ──────────────────────────────────────

function toViemChain(chain: ChainConfig): ViemChain {
  return viemDefineChain({
    id: chain.id,
    name: chain.displayName,
    nativeCurrency: {
      name: chain.nativeToken.symbol,
      symbol: chain.nativeToken.symbol,
      decimals: chain.nativeToken.decimals,
    },
    rpcUrls: {
      default: {
        http: [...chain.rpc.http],
        ...(chain.rpc.ws ? { webSocket: [...chain.rpc.ws] } : {}),
      },
    },
    ...(chain.explorer
      ? {
          blockExplorers: {
            default: { name: chain.explorer.name, url: chain.explorer.url },
          },
        }
      : {}),
  });
}

function createEspaceClient(chain: ChainConfig, transport: Transport): EspaceClient {
  const viemChain = toViemChain(chain);
  const publicClient = createPublicClient({
    chain: viemChain,
    transport: transport._viem,
  });

  return {
    family: 'espace',
    chain,
    transport,

    request<T = unknown>(req: RpcRequest, _opts?: CallOptions): Promise<T> {
      return wrapRpc(
        publicClient.request({
          method: req.method as never,
          params: req.params as never,
        }) as Promise<T>,
        'core/rpc/request',
        { method: req.method },
      );
    },

    getBlockNumber(_opts?: CallOptions): Promise<bigint> {
      return wrapRpc(publicClient.getBlockNumber(), 'core/rpc/get-block-number');
    },

    getBlock(tag: BlockTag, _opts?: CallOptions): Promise<Block> {
      const arg =
        typeof tag === 'bigint'
          ? { blockNumber: tag }
          : tag === 'latest' ||
              tag === 'pending' ||
              tag === 'earliest' ||
              tag === 'finalized' ||
              tag === 'safe'
            ? { blockTag: tag }
            : { blockHash: tag };
      return wrapRpc(publicClient.getBlock(arg as never) as Promise<Block>, 'core/rpc/get-block', {
        tag: typeof tag === 'bigint' ? tag.toString() : String(tag),
      });
    },

    getBalance(address: Address, opts?: GetBalanceOptions): Promise<Wei> {
      const arg: Parameters<typeof publicClient.getBalance>[0] = { address };
      if (opts?.blockTag !== undefined) {
        if (typeof opts.blockTag === 'bigint') {
          arg.blockNumber = opts.blockTag;
        } else if (
          opts.blockTag === 'latest' ||
          opts.blockTag === 'pending' ||
          opts.blockTag === 'earliest' ||
          opts.blockTag === 'finalized' ||
          opts.blockTag === 'safe'
        ) {
          arg.blockTag = opts.blockTag;
        }
      }
      return wrapRpc(publicClient.getBalance(arg), 'core/rpc/get-balance', { address });
    },

    getTransactionReceipt(hash: Hash, _opts?: CallOptions): Promise<TxReceipt | null> {
      return wrapRpc(
        publicClient.getTransactionReceipt({ hash }).catch((err: unknown) => {
          if (err && typeof err === 'object' && 'name' in err) {
            const name = (err as { name?: string }).name;
            if (name === 'TransactionReceiptNotFoundError') return null;
          }
          throw err;
        }),
        'core/rpc/get-receipt',
        { hash },
      );
    },

    estimateGas(input: TxRequest, _opts?: CallOptions): Promise<bigint> {
      return wrapRpc(
        publicClient.estimateGas(input as Parameters<typeof publicClient.estimateGas>[0]),
        'core/rpc/estimate-gas',
      );
    },
  };
}

// ── Core Space (cive-backed) implementation ──────────────────────────────────

function toCiveChain(chain: ChainConfig): Parameters<typeof civeDefineChain>[0] {
  return {
    id: chain.id,
    name: chain.displayName,
    nativeCurrency: {
      name: chain.nativeToken.symbol,
      symbol: chain.nativeToken.symbol,
      decimals: chain.nativeToken.decimals,
    },
    rpcUrls: {
      default: {
        http: [...chain.rpc.http],
        ...(chain.rpc.ws ? { webSocket: [...chain.rpc.ws] } : {}),
      },
    },
    ...(chain.explorer
      ? {
          blockExplorers: {
            default: { name: chain.explorer.name, url: chain.explorer.url },
          },
        }
      : {}),
  };
}

function createCoreClient(chain: ChainConfig, transport: Transport): CoreSpaceClient {
  const civeChain = civeDefineChain(toCiveChain(chain));
  const publicClient = createCivePublicClient({
    chain: civeChain,
    transport: transport._cive,
  });

  return {
    family: 'core',
    chain,
    transport,

    request<T = unknown>(req: RpcRequest, _opts?: CallOptions): Promise<T> {
      return wrapRpc(
        publicClient.request({
          method: req.method as never,
          params: req.params as never,
        }) as Promise<T>,
        'core/rpc/request',
        { method: req.method },
      );
    },

    getEpochNumber(opts?: CoreCallOptions): Promise<bigint> {
      return wrapRpc(
        civeGetEpochNumber(publicClient, opts?.epochTag ? { epochTag: opts.epochTag } : {}),
        'core/rpc/get-epoch-number',
      );
    },

    getStatus(_opts?: CallOptions): Promise<NodeStatus> {
      return wrapRpc(civeGetStatus(publicClient) as Promise<NodeStatus>, 'core/rpc/get-status');
    },

    getBalance(address: string, opts?: CoreCallOptions): Promise<Wei> {
      const params = { address: address as never } as Parameters<typeof civeGetBalance>[1];
      if (opts?.epochTag) {
        (params as { epochTag?: EpochTag }).epochTag = opts.epochTag;
      }
      return wrapRpc(civeGetBalance(publicClient, params), 'core/rpc/get-balance', { address });
    },
  };
}
