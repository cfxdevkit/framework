import type { Client, Hex, SignableTx, Signer, SignOptions, TxReceipt } from '@cfxdevkit/core';
import type { Abi, ContractConstructorArgs } from 'viem';

export interface DeployContractInput<TAbi extends Abi> {
  client: Client;
  signer: Signer;
  abi: TAbi;
  bytecode: Hex;
  args?: ContractConstructorArgs<TAbi>;
  value?: bigint;
  gas?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasPrice?: bigint;
  storageLimit?: bigint;
  epochHeight?: bigint;
  coreType?: 'legacy' | 'cip2930' | 'cip1559';
  waitForReceipt?: boolean;
  pollIntervalMs?: number;
  receiptTimeoutMs?: number;
  signOptions?: SignOptions;
}

export interface DeployContractResult {
  hash: Hex;
  request: SignableTx;
  rawTransaction: Hex;
  /** Populated only when `waitForReceipt: true`. */
  address?: string;
  receipt?: TxReceipt;
}
