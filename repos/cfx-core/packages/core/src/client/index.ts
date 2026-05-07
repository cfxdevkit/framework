import type { ChainConfig } from '../chains/index.js';
import type {
  Address,
  Block,
  BlockTag,
  CoreLog,
  CoreLogFilter,
  EpochTag,
  Hash,
  Hex,
  NodeStatus,
  SponsorInfo,
  TxReceipt,
  TxRequest,
  Wei,
} from '../types/index.js';
import { createCoreClient } from './core.js';
import { createEspaceClient } from './espace.js';
import type { Transport } from './transport.js';

export type { HttpTransportOptions, Transport, WsTransportOptions } from './transport.js';
export { fallback, http, ws } from './transport.js';

export interface RpcRequest {
  method: string;
  params?: readonly unknown[];
}

export interface CallOptions {
  signal?: AbortSignal;
}

export interface GetBalanceOptions extends CallOptions {
  blockTag?: BlockTag;
}

export interface CoreCallOptions extends CallOptions {
  epochTag?: Exclude<EpochTag, 'latest_confirmed'>;
}

interface ClientBase {
  readonly chain: ChainConfig;
  readonly transport: Transport;
  request<T = unknown>(req: RpcRequest, opts?: CallOptions): Promise<T>;
}

export interface EspaceClient extends ClientBase {
  readonly family: 'espace';
  getBlockNumber(opts?: CallOptions): Promise<bigint>;
  getBlock(tag: BlockTag, opts?: CallOptions): Promise<Block>;
  getBalance(address: Address, opts?: GetBalanceOptions): Promise<Wei>;
  getTransaction(hash: Hash, opts?: CallOptions): Promise<unknown | null>;
  getTransactionReceipt(hash: Hash, opts?: CallOptions): Promise<TxReceipt | null>;
  getTransactionCount(address: Address, opts?: GetBalanceOptions): Promise<number>;
  getGasPrice(opts?: CallOptions): Promise<bigint>;
  estimateGas(input: TxRequest, opts?: CallOptions): Promise<bigint>;
  sendRawTransaction(signedTx: Hex, opts?: CallOptions): Promise<Hash>;
}

export interface CoreSpaceClient extends ClientBase {
  readonly family: 'core';
  getEpochNumber(opts?: CoreCallOptions): Promise<bigint>;
  getStatus(opts?: CallOptions): Promise<NodeStatus>;
  getBalance(address: string, opts?: CoreCallOptions): Promise<Wei>;
  getTransaction(hash: Hash, opts?: CallOptions): Promise<unknown | null>;
  getTransactionReceipt(hash: Hash, opts?: CallOptions): Promise<TxReceipt | null>;
  getTransactionCount(address: string, opts?: CoreCallOptions): Promise<number>;
  getGasPrice(opts?: CallOptions): Promise<bigint>;
  sendRawTransaction(signedTx: Hex, opts?: CallOptions): Promise<Hash>;
  getLogs(filter: CoreLogFilter, opts?: CallOptions): Promise<CoreLog[]>;
  getSponsorInfo(address: string, opts?: CoreCallOptions): Promise<SponsorInfo>;
  getAdmin(address: string, opts?: CoreCallOptions): Promise<string | null>;
}

export type Client = EspaceClient | CoreSpaceClient;

export interface CreateClientInput {
  chain: ChainConfig;
  transport: Transport;
}

export function createClient(input: CreateClientInput): Client {
  const { chain, transport } = input;
  return chain.family === 'core'
    ? createCoreClient(chain, transport)
    : createEspaceClient(chain, transport);
}
