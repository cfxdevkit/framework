/**
 * `@cfxdevkit/core/client` — chain-aware RPC client factory.
 *
 * The factory returns an opaque {@link Client} object. The client has
 * **no signer**, **no chain switching**, and **no caching** — those concerns
 * live in `framework/wallet`, the consumer, and `framework/react` respectively.
 *
 * ### eSpace
 * Backed by `viem`. Full support in Phase I.
 *
 * ### Core Space
 * Backed by `cive`. Phase I exposes the surface but throws
 * `RpcError code=core/client/unsupported-family` until Phase II.
 */
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
import type { Address, Block, BlockTag, Hash, TxReceipt, TxRequest, Wei } from '../types/index.js';

// ── Transport ────────────────────────────────────────────────────────────────

/**
 * Opaque transport descriptor. Created via {@link http}, {@link ws}, or
 * {@link fallback}; consumed by {@link createClient}.
 *
 * The internal handle is only used by the client implementation; callers
 * must treat it as opaque.
 */
export interface Transport {
  readonly kind: 'http' | 'ws' | 'fallback';
  /** @internal */
  readonly _viem: ViemTransport;
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
  return { kind: 'http', _viem: viemHttp(url, viemOpts) };
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
  return { kind: 'ws', _viem: viemWebSocket(url, viemOpts) };
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

/** Options for `getBalance`. */
export interface GetBalanceOptions extends CallOptions {
  blockTag?: BlockTag;
}

/**
 * Opaque chain client. The interface is intentionally narrow: low-level
 * everything-you-need methods plus a generic `request` escape hatch. Higher
 * verbs (`readContract`, `writeContract`, etc.) live in `core/contract` and
 * take a `Client` as input — they are NOT methods on `Client`.
 */
export interface Client {
  readonly chain: ChainConfig;
  readonly transport: Transport;

  /** Generic JSON-RPC request. Prefer the typed methods below when available. */
  request<T = unknown>(req: RpcRequest, opts?: CallOptions): Promise<T>;

  /** Latest block number. */
  getBlockNumber(opts?: CallOptions): Promise<bigint>;

  /** Block by tag (`'latest'`, `'pending'`, hex hash, or bigint number). */
  getBlock(tag: BlockTag, opts?: CallOptions): Promise<Block>;

  /** Native-token balance of an address, in wei. */
  getBalance(address: Address, opts?: GetBalanceOptions): Promise<Wei>;

  /** Receipt for a mined transaction; `null` if not yet mined / unknown. */
  getTransactionReceipt(hash: Hash, opts?: CallOptions): Promise<TxReceipt | null>;

  /** Estimate gas for an unsigned transaction request. */
  estimateGas(input: TxRequest, opts?: CallOptions): Promise<bigint>;
}

export interface CreateClientInput {
  chain: ChainConfig;
  transport: Transport;
}

/**
 * Build a {@link Client} for the given chain + transport.
 *
 * @throws {RpcError} `core/client/unsupported-family` when called with a
 * Core Space chain in Phase I (Core Space support arrives in Phase II).
 */
export function createClient(input: CreateClientInput): Client {
  const { chain, transport } = input;
  if (chain.family === 'core') {
    throw new RpcError({
      code: 'core/client/unsupported-family',
      message: `Core Space client is not yet implemented (chain=${chain.name}). Phase II will add cive-backed support.`,
      meta: { chainId: chain.id, family: chain.family },
    });
  }
  return createEspaceClient(chain, transport);
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

function createEspaceClient(chain: ChainConfig, transport: Transport): Client {
  const viemChain = toViemChain(chain);
  const publicClient = createPublicClient({
    chain: viemChain,
    transport: transport._viem,
  });

  return {
    chain,
    transport,

    request<T = unknown>(req: RpcRequest, _opts?: CallOptions): Promise<T> {
      // viem typings expect a `Method` literal. Casting at the boundary keeps
      // the public surface generic while letting viem forward to the transport.
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
      // viem's overloaded `getBlock` accepts these shapes; cast through `never`
      // to satisfy the union without losing the runtime semantics.
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
          // viem throws when the hash is unknown; surface as null per docs.
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
