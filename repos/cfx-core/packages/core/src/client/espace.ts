import { createPublicClient, type Chain as ViemChain, defineChain as viemDefineChain } from 'viem';
import type { ChainConfig } from '../chains/index.js';
import type { Address, Block, BlockTag, Hash, TxReceipt, TxRequest, Wei } from '../types/index.js';
import { nullWhenNotFound, wrapRpc } from './errors.js';
import type { CallOptions, EspaceClient, GetBalanceOptions, RpcRequest } from './index.js';
import type { Transport } from './transport.js';

export function createEspaceClient(chain: ChainConfig, transport: Transport): EspaceClient {
  const publicClient = createPublicClient({
    chain: toViemChain(chain),
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
      const arg = typeof tag === 'bigint' ? { blockNumber: tag } : espaceBlockTagArg(tag);
      return wrapRpc(publicClient.getBlock(arg as never) as Promise<Block>, 'core/rpc/get-block', {
        tag: typeof tag === 'bigint' ? tag.toString() : String(tag),
      });
    },
    getBalance(address: Address, opts?: GetBalanceOptions): Promise<Wei> {
      return wrapRpc(
        publicClient.getBalance(espaceBalanceArg(address, opts)),
        'core/rpc/get-balance',
        { address },
      );
    },
    getTransactionReceipt(hash: Hash, _opts?: CallOptions): Promise<TxReceipt | null> {
      return wrapRpc(
        nullWhenNotFound(
          publicClient.getTransactionReceipt({ hash }),
          'TransactionReceiptNotFoundError',
        ),
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
      ? { blockExplorers: { default: { name: chain.explorer.name, url: chain.explorer.url } } }
      : {}),
  });
}

function espaceBlockTagArg(tag: Exclude<BlockTag, bigint>) {
  return tag === 'latest' ||
    tag === 'pending' ||
    tag === 'earliest' ||
    tag === 'finalized' ||
    tag === 'safe'
    ? { blockTag: tag }
    : { blockHash: tag };
}

function espaceBalanceArg(
  address: Address,
  opts?: GetBalanceOptions,
): Parameters<ReturnType<typeof createPublicClient>['getBalance']>[0] {
  const arg: Parameters<ReturnType<typeof createPublicClient>['getBalance']>[0] = { address };
  if (typeof opts?.blockTag === 'bigint') arg.blockNumber = opts.blockTag;
  else if (opts?.blockTag !== undefined) arg.blockTag = opts.blockTag;
  return arg;
}
