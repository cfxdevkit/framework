/**
 * `@cfxdevkit/contracts/deploy` — deploy bytecode + (optional) constructor args
 * via the framework's `Signer` and `Client`.
 *
 * Mirrors {@link sendWrite}'s contract: returns the tx hash and (when asked)
 * waits for the receipt to extract the deployed contract address.
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
import type { Abi, ContractConstructorArgs } from 'viem';
import { encodeDeployData, hexToBigInt, toHex } from 'viem';
import { ContractsError } from '../errors/index.js';
import { waitForReceipt } from '../write/index.js';

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
  address?: Address;
  receipt?: TxReceipt;
}

export async function deployContract<TAbi extends Abi>(
  input: DeployContractInput<TAbi>,
): Promise<DeployContractResult> {
  if (input.client.family !== 'espace') {
    throw new ContractsError({
      code: 'contracts/unsupported-family',
      message: `deployContract currently supports eSpace only (got family="${input.client.family}")`,
      meta: { family: input.client.family },
    });
  }

  const data = encodeDeployData({
    abi: input.abi,
    bytecode: input.bytecode,
    ...(input.args !== undefined ? { args: input.args } : {}),
  } as Parameters<typeof encodeDeployData>[0]) as Hex;

  const chainId = input.client.chain.id;
  const from = input.signer.account.address;

  const [nonceHex, gasEstimate] = await Promise.all([
    input.client.request<Hex>({ method: 'eth_getTransactionCount', params: [from, 'pending'] }),
    input.gas !== undefined
      ? Promise.resolve(input.gas)
      : input.client.estimateGas({
          from,
          data,
          ...(input.value !== undefined ? { value: input.value } : {}),
        } as never),
  ]);

  const baseFee = await fetchBaseFee(input.client);
  const maxPriorityFeePerGas = input.maxPriorityFeePerGas ?? 1_000_000_000n;
  const maxFeePerGas = input.maxFeePerGas ?? baseFee * 2n + maxPriorityFeePerGas;

  const tx: SignableTx = {
    chainId,
    data,
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

  const out: DeployContractResult = { hash, request: tx, rawTransaction };
  if (input.waitForReceipt) {
    const receipt = await waitForReceipt(input.client, hash, {
      pollIntervalMs: input.pollIntervalMs ?? 1500,
      timeoutMs: input.receiptTimeoutMs ?? 60_000,
    });
    out.receipt = receipt;
    if (receipt.contractAddress) out.address = receipt.contractAddress;
  }
  return out;
}

async function fetchBaseFee(client: Client): Promise<bigint> {
  if (client.family !== 'espace') return 1_000_000_000n;
  try {
    const block = await client.getBlock('latest');
    const baseFee = (block as unknown as { baseFeePerGas?: bigint }).baseFeePerGas;
    return baseFee ?? 1_000_000_000n;
  } catch {
    return 1_000_000_000n;
  }
}

// Avoid a build-time complaint when toHex stays unused after edits — keep the
// re-export so callers can import it conveniently from this module.
export { toHex };
