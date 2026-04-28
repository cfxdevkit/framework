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
