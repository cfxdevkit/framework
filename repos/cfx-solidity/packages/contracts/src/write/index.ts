import type { Client, Hex, SignableTx, Signer, SignOptions, TxReceipt } from '@cfxdevkit/core';
import type { Abi, ContractFunctionArgs, ContractFunctionName } from 'viem';
import { encodeFunctionData } from 'viem';
import { sendCoreWrite } from './core.js';
import { sendEspaceWrite } from './espace.js';

export { waitForReceipt } from './receipt.js';

export interface PrepareWriteInput<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
> {
  address: string;
  abi: TAbi;
  functionName: TName;
  args?: ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TName>;
  value?: bigint;
  chainId: number;
  family?: 'espace' | 'core';
  nonce?: number;
  gas?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasPrice?: bigint;
  storageLimit?: bigint;
  epochHeight?: bigint;
  coreType?: 'legacy' | 'cip2930' | 'cip1559';
}

export function prepareWrite<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
>(input: PrepareWriteInput<TAbi, TName>): SignableTx {
  const tx: SignableTx = {
    chainId: input.chainId,
    to: input.address,
    data: encodeWriteData(input),
    ...(input.family ? { family: input.family } : {}),
  };
  applyOptionalWriteFields(tx, input);
  return tx;
}

export interface SendWriteInput<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
> extends Omit<PrepareWriteInput<TAbi, TName>, 'chainId' | 'family'> {
  client: Client;
  signer: Signer;
  waitForReceipt?: boolean;
  pollIntervalMs?: number;
  receiptTimeoutMs?: number;
  signOptions?: SignOptions;
}

export interface SendWriteResult {
  hash: Hex;
  request: SignableTx;
  rawTransaction: Hex;
  receipt?: TxReceipt;
}

export async function sendWrite<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
>(input: SendWriteInput<TAbi, TName>): Promise<SendWriteResult> {
  return input.client.family === 'core'
    ? sendCoreWrite(input, input.client)
    : sendEspaceWrite(input, input.client);
}

function encodeWriteData<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
>(input: Pick<PrepareWriteInput<TAbi, TName>, 'abi' | 'functionName' | 'args'>): Hex {
  return encodeFunctionData({
    abi: input.abi,
    functionName: input.functionName,
    ...(input.args !== undefined ? { args: input.args } : {}),
  } as Parameters<typeof encodeFunctionData>[0]) as Hex;
}

function applyOptionalWriteFields<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
>(tx: SignableTx, input: PrepareWriteInput<TAbi, TName>) {
  if (input.value !== undefined) tx.value = input.value;
  if (input.nonce !== undefined) tx.nonce = input.nonce;
  if (input.gas !== undefined) tx.gas = input.gas;
  if (input.maxFeePerGas !== undefined) tx.maxFeePerGas = input.maxFeePerGas;
  if (input.maxPriorityFeePerGas !== undefined)
    tx.maxPriorityFeePerGas = input.maxPriorityFeePerGas;
  if (input.gasPrice !== undefined) tx.gasPrice = input.gasPrice;
  if (input.storageLimit !== undefined) tx.storageLimit = input.storageLimit;
  if (input.epochHeight !== undefined) tx.epochHeight = input.epochHeight;
  if (input.coreType !== undefined) tx.coreType = input.coreType;
}
