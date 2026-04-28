/**
 * `@cfxdevkit/core/types` — primitive value types shared across the framework.
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
