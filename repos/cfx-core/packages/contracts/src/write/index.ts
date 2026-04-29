/**
 * `@cfxdevkit/contracts/write` — typed contract writes.
 *
 * Splits the operation in two:
 *
 * 1. {@link prepareWrite} — pure helper that returns the encoded
 *    `SignableTx` (no RPC, no signing). Useful for batching, simulation, or
 *    handing the payload to an off-process signer.
 * 2. {@link sendWrite} — full pipeline: gas + nonce + fee defaults filled in
 *    from the client, payload signed with the supplied {@link Signer}, raw
 *    transaction broadcast, and (optionally) the receipt awaited.
 *
 * eSpace only in this revision.
 */
import type {
  Address,
  Client,
  Hex,
  SignableTx,
  Signer,
  SignOptions,
  TxReceipt,
} from '@cfxdevkit/core';
import type { Abi, ContractFunctionArgs, ContractFunctionName } from 'viem';
import { encodeFunctionData, hexToBigInt, toHex } from 'viem';
import { ContractsError } from '../errors/index.js';

export interface PrepareWriteInput<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
> {
  address: Address;
  abi: TAbi;
  functionName: TName;
  args?: ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TName>;
  /** Native value (wei) to send with the call. Required for `payable`. */
  value?: bigint;
  /** Caller address (used to encode the chainId-aware tx). */
  chainId: number;
  nonce?: number;
  gas?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

/** Pure helper — encodes the call into a `SignableTx` for an external signer. */
export function prepareWrite<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
>(input: PrepareWriteInput<TAbi, TName>): SignableTx {
  const data = encodeFunctionData({
    abi: input.abi,
    functionName: input.functionName,
    ...(input.args !== undefined ? { args: input.args } : {}),
  } as Parameters<typeof encodeFunctionData>[0]) as Hex;

  const tx: SignableTx = {
    chainId: input.chainId,
    to: input.address,
    data,
  };
  if (input.value !== undefined) tx.value = input.value;
  if (input.nonce !== undefined) tx.nonce = input.nonce;
  if (input.gas !== undefined) tx.gas = input.gas;
  if (input.maxFeePerGas !== undefined) tx.maxFeePerGas = input.maxFeePerGas;
  if (input.maxPriorityFeePerGas !== undefined)
    tx.maxPriorityFeePerGas = input.maxPriorityFeePerGas;
  return tx;
}

export interface SendWriteInput<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
> extends Omit<PrepareWriteInput<TAbi, TName>, 'chainId' | 'nonce' | 'gas'> {
  client: Client;
  signer: Signer;
  /** Wait for the receipt before resolving (default: false). */
  waitForReceipt?: boolean;
  /** Polling interval in ms when `waitForReceipt` is true (default: 1500). */
  pollIntervalMs?: number;
  /** Maximum time to wait for a receipt (default: 60_000ms). */
  receiptTimeoutMs?: number;
  signOptions?: SignOptions;
}

export interface SendWriteResult {
  hash: Hex;
  request: SignableTx;
  rawTransaction: Hex;
  receipt?: TxReceipt;
}

/**
 * Sign + broadcast a write. Fills missing `nonce`, `gas`, fee fields by
 * querying the client; throws `contracts/unsupported-family` for non-eSpace.
 */
export async function sendWrite<
  TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
>(input: SendWriteInput<TAbi, TName>): Promise<SendWriteResult> {
  if (input.client.family !== 'espace') {
    throw new ContractsError({
      code: 'contracts/unsupported-family',
      message: `sendWrite currently supports eSpace only (got family="${input.client.family}")`,
      meta: { family: input.client.family },
    });
  }

  const chainId = input.client.chain.id;
  const from = input.signer.account.address;

  // Encode the call data (no fees yet) so estimateGas has something to chew on.
  const baseData = encodeFunctionData({
    abi: input.abi,
    functionName: input.functionName,
    ...(input.args !== undefined ? { args: input.args } : {}),
  } as Parameters<typeof encodeFunctionData>[0]) as Hex;

  const callObject: Record<string, unknown> = { from, to: input.address, data: baseData };
  if (input.value !== undefined) callObject.value = toHex(input.value);

  const [nonceHex, gasEstimate, feeHistoryBaseFee] = await Promise.all([
    input.client.request<Hex>({ method: 'eth_getTransactionCount', params: [from, 'pending'] }),
    input.value !== undefined
      ? input.client.estimateGas({
          from,
          to: input.address,
          data: baseData,
          value: input.value,
        } as never)
      : input.client.estimateGas({ from, to: input.address, data: baseData } as never),
    fetchBaseFee(input.client),
  ]);

  const maxPriorityFeePerGas = input.maxPriorityFeePerGas ?? 1_000_000_000n; // 1 gwei
  const maxFeePerGas = input.maxFeePerGas ?? feeHistoryBaseFee * 2n + maxPriorityFeePerGas;

  const tx: SignableTx = {
    chainId,
    to: input.address,
    data: baseData,
    nonce: Number(hexToBigInt(nonceHex)),
    gas: gasEstimate,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
  if (input.value !== undefined) tx.value = input.value;

  const rawTransaction = await input.signer.signTransaction(tx, input.signOptions ?? {});
  const hash = await input.client.request<Hex>({
    method: 'eth_sendRawTransaction',
    params: [rawTransaction],
  });

  const out: SendWriteResult = { hash, request: tx, rawTransaction };
  if (input.waitForReceipt) {
    out.receipt = await waitForReceipt(input.client, hash, {
      pollIntervalMs: input.pollIntervalMs ?? 1500,
      timeoutMs: input.receiptTimeoutMs ?? 60_000,
    });
  }
  return out;
}

/** Best-effort `eth_baseFee` lookup; falls back to 1 gwei when unsupported. */
async function fetchBaseFee(client: Client): Promise<bigint> {
  try {
    const block = await (client as Extract<Client, { family: 'espace' }>).getBlock('latest');
    const baseFee = (block as unknown as { baseFeePerGas?: bigint }).baseFeePerGas;
    return baseFee ?? 1_000_000_000n;
  } catch {
    return 1_000_000_000n;
  }
}

export async function waitForReceipt(
  client: Client,
  hash: Hex,
  opts: { pollIntervalMs: number; timeoutMs: number },
): Promise<TxReceipt> {
  if (client.family !== 'espace') {
    throw new ContractsError({
      code: 'contracts/unsupported-family',
      message: 'waitForReceipt currently supports eSpace only',
    });
  }
  const deadline = Date.now() + opts.timeoutMs;
  while (Date.now() < deadline) {
    const receipt = await client.getTransactionReceipt(hash);
    if (receipt) {
      if (receipt.status === 'reverted') {
        throw new ContractsError({
          code: 'contracts/reverted',
          message: `transaction ${hash} reverted`,
          meta: { hash, blockNumber: receipt.blockNumber.toString() },
        });
      }
      return receipt;
    }
    await sleep(opts.pollIntervalMs);
  }
  throw new ContractsError({
    code: 'contracts/receipt-timeout',
    message: `receipt for ${hash} not found within ${opts.timeoutMs}ms`,
    meta: { hash },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
