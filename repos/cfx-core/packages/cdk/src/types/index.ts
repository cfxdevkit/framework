/**
 * `@cfxdevkit/cdk/types` — primitive value types shared across the framework.
 *
 * These are the **wire** types: byte-exact representations of EVM values.
 * Value types are re-exported from `viem` to stay drop-in compatible with the
 * broader EVM ecosystem; aliases give them framework-stable names.
 */
import type {
  Address as ViemAddress,
  Block as ViemBlock,
  BlockTag as ViemBlockTag,
  Hash as ViemHash,
  Hex as ViemHex,
  Log as ViemLog,
  TransactionReceipt as ViemTxReceipt,
  TransactionRequest as ViemTxRequest,
  TypedDataDefinition as ViemTypedDataDefinition,
} from 'viem';

/** Hex-encoded 0x-prefixed EVM address (20 bytes, EIP-55 checksum recommended). */
export type Address = ViemAddress;

/** Hex-encoded 32-byte transaction or block hash. */
export type Hash = ViemHash;

/** Generic 0x-prefixed hex byte string of any length. */
export type Hex = ViemHex;

/** Token amount in the smallest indivisible unit (wei for 18-decimal tokens). */
export type Wei = bigint;

/** Numeric chain identifier (EIP-155). */
export type ChainId = number;

/** Block selector accepted by RPC `*ByBlock` calls. */
export type BlockTag = ViemBlockTag | bigint;

/** Decoded block payload as returned by `eth_getBlockBy*`. */
export type Block = ViemBlock;

/** Unsigned transaction shape accepted by gas estimation, simulation and signers. */
export type TxRequest = ViemTxRequest;

/** Receipt returned by `eth_getTransactionReceipt`. */
export type TxReceipt = ViemTxReceipt;

/** EIP-712 typed-data definition (`{ domain, types, primaryType, message }`). */
export type TypedData = ViemTypedDataDefinition;

/** Raw, undecoded log emitted by a transaction. */
export type RawLog = ViemLog;

/**
 * Conflux Core-Space epoch selector.
 *
 * - `latest_state` — last executed epoch (recommended for reads)
 * - `latest_mined` — head of the chain
 * - `latest_finalized` — last finalized by PoS
 * - `latest_checkpoint` — most recent checkpoint
 * - `earliest` — genesis
 */
export type EpochTag =
  | 'earliest'
  | 'latest_checkpoint'
  | 'latest_finalized'
  | 'latest_mined'
  | 'latest_state';

/** Conflux Core-Space node status snapshot returned by `cfx_getStatus`. */
export interface NodeStatus {
  bestHash: Hash;
  blockNumber: bigint;
  chainId: number;
  networkId: number;
  ethereumSpaceChainId: number;
  epochNumber: bigint;
  latestCheckpoint: bigint;
  latestConfirmed: bigint;
  latestFinalized: bigint;
  latestState: bigint;
  pendingTxNumber: number;
}

/**
 * Filter accepted by Core-Space `cfx_getLogs`. Either an epoch range,
 * a block-number range, or a list of block hashes — the three windowing
 * modes are mutually exclusive at runtime.
 */
export interface CoreLogFilter {
  /** Base32 contract address(es). */
  address?: string | readonly string[];
  /** Topic filter; same shape as `eth_getLogs` (positional, supports null wildcards). */
  topics?: readonly (Hex | readonly Hex[] | null)[];
  fromEpoch?: bigint | Exclude<EpochTag, 'latest_finalized' | 'latest_mined'>;
  toEpoch?: bigint | Exclude<EpochTag, 'latest_finalized' | 'latest_mined'>;
  fromBlock?: bigint;
  toBlock?: bigint;
  blockHashes?: readonly Hash[];
}

/** Decoded log entry as returned by Conflux `cfx_getLogs`. */
export interface CoreLog {
  address: string;
  topics: readonly Hex[];
  data: Hex;
  blockHash: Hash;
  epochNumber: bigint;
  transactionHash: Hash;
  transactionIndex: bigint;
  logIndex: bigint;
  transactionLogIndex: bigint;
}

/** Sponsor-pool snapshot for a Conflux contract (`cfx_getSponsorInfo`). */
export interface SponsorInfo {
  sponsorBalanceForCollateral: bigint;
  sponsorBalanceForGas: bigint;
  sponsorGasBound: bigint;
  sponsorForCollateral: string;
  sponsorForGas: string;
  usedStoragePoints: bigint;
  availableStoragePoints: bigint;
}
