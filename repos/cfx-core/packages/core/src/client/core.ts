import { createPublicClient as createCivePublicClient } from 'cive';
import {
  getAdmin as civeGetAdmin,
  getBalance as civeGetBalance,
  getEpochNumber as civeGetEpochNumber,
  getLogs as civeGetLogs,
  GetSponsorInfo as civeGetSponsorInfo,
  getStatus as civeGetStatus,
  getTransaction as civeGetTransaction,
  getTransactionReceipt as civeGetTransactionReceipt,
} from 'cive/actions';
import { defineChain as civeDefineChain } from 'cive/utils';
import type { ChainConfig } from '../chains/index.js';
import type {
  CoreLog,
  CoreLogFilter,
  EpochTag,
  Hash,
  NodeStatus,
  SponsorInfo,
  TxReceipt,
  Wei,
} from '../types/index.js';
import { nullWhenNotFound, wrapRpc } from './errors.js';
import type { CallOptions, CoreCallOptions, CoreSpaceClient, RpcRequest } from './index.js';
import type { Transport } from './transport.js';

export function createCoreClient(chain: ChainConfig, transport: Transport): CoreSpaceClient {
  const publicClient = createCivePublicClient({
    chain: civeDefineChain(toCiveChain(chain)),
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
      return wrapRpc(
        civeGetBalance(publicClient, coreEpochParams<typeof civeGetBalance>(address, opts)),
        'core/rpc/get-balance',
        { address },
      );
    },
    getTransactionReceipt(hash: Hash, _opts?: CallOptions): Promise<TxReceipt | null> {
      return wrapRpc(
        nullWhenNotFound(
          civeGetTransactionReceipt(publicClient, { hash }).then((r) => r as unknown as TxReceipt),
          'TransactionReceiptNotFoundError',
        ),
        'core/rpc/get-receipt',
        { hash },
      );
    },
    getTransaction(hash: Hash, _opts?: CallOptions): Promise<unknown | null> {
      return wrapRpc(
        nullWhenNotFound(civeGetTransaction(publicClient, { hash }), 'TransactionNotFoundError'),
        'core/rpc/get-transaction',
        { hash },
      );
    },
    getLogs(filter: CoreLogFilter, _opts?: CallOptions): Promise<CoreLog[]> {
      const params = filter as unknown as Parameters<typeof civeGetLogs>[1];
      return wrapRpc(
        civeGetLogs(publicClient, params) as unknown as Promise<CoreLog[]>,
        'core/rpc/get-logs',
      );
    },
    getSponsorInfo(address: string, opts?: CoreCallOptions): Promise<SponsorInfo> {
      return wrapRpc(
        civeGetSponsorInfo(
          publicClient,
          coreEpochParams<typeof civeGetSponsorInfo>(address, opts),
        ) as unknown as Promise<SponsorInfo>,
        'core/rpc/get-sponsor-info',
        { address },
      );
    },
    getAdmin(address: string, opts?: CoreCallOptions): Promise<string | null> {
      return wrapRpc(
        civeGetAdmin(
          publicClient,
          coreEpochParams<typeof civeGetAdmin>(address, opts),
        ) as unknown as Promise<string | null>,
        'core/rpc/get-admin',
        { address },
      );
    },
  };
}

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
      ? { blockExplorers: { default: { name: chain.explorer.name, url: chain.explorer.url } } }
      : {}),
  };
}

function coreEpochParams<T extends (...args: never[]) => unknown>(
  address: string,
  opts?: CoreCallOptions,
): Parameters<T>[1] {
  const params = { address: address as never } as Parameters<T>[1];
  if (opts?.epochTag) (params as { epochTag?: EpochTag }).epochTag = opts.epochTag;
  return params;
}
