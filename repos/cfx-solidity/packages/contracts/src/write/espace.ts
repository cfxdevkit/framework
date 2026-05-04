import type { EspaceClient, Hex, SignableTx } from '@cfxdevkit/core';
import type { Abi, ContractFunctionName } from 'viem';
import { encodeFunctionData, hexToBigInt } from 'viem';
import { ContractsError } from '../errors/index.js';
import type { SendWriteInput, SendWriteResult } from './index.js';
import { waitForReceipt } from './receipt.js';

type GenericSendWriteInput = SendWriteInput<
  Abi,
  ContractFunctionName<Abi, 'nonpayable' | 'payable'>
>;

export async function sendEspaceWrite(
  input: GenericSendWriteInput,
  client: EspaceClient,
): Promise<SendWriteResult> {
  if (!/^0x[0-9a-fA-F]{40}$/.test(input.address)) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message: `Expected 0x-prefixed 20-byte hex address for eSpace, got: ${input.address}`,
      meta: { address: input.address, family: 'espace' },
    });
  }
  const from = input.signer.account.address;
  const baseData = encodeFunctionData({
    abi: input.abi,
    functionName: input.functionName,
    ...(input.args !== undefined ? { args: input.args } : {}),
  } as Parameters<typeof encodeFunctionData>[0]) as Hex;
  const [nonceHex, gasEstimate, feeHistoryBaseFee] = await Promise.all([
    client.request<Hex>({ method: 'eth_getTransactionCount', params: [from, 'pending'] }),
    estimateEspaceGas(input, client, from, baseData),
    fetchEspaceBaseFee(client),
  ]);
  const maxPriorityFeePerGas = input.maxPriorityFeePerGas ?? 1_000_000_000n;
  const tx: SignableTx = {
    family: 'espace',
    chainId: client.chain.id,
    to: input.address,
    data: baseData,
    nonce: input.nonce ?? Number(hexToBigInt(nonceHex)),
    gas: gasEstimate,
    maxFeePerGas: input.maxFeePerGas ?? feeHistoryBaseFee * 2n + maxPriorityFeePerGas,
    maxPriorityFeePerGas,
  };
  if (input.value !== undefined) tx.value = input.value;
  const rawTransaction = (await input.signer.signTransaction(tx, input.signOptions ?? {})) as Hex;
  const hash = await client.request<Hex>({
    method: 'eth_sendRawTransaction',
    params: [rawTransaction],
  });
  const out: SendWriteResult = { hash, request: tx, rawTransaction };
  if (input.waitForReceipt)
    out.receipt = await waitForReceipt(client, hash, {
      pollIntervalMs: input.pollIntervalMs ?? 1500,
      timeoutMs: input.receiptTimeoutMs ?? 60_000,
    });
  return out;
}

function estimateEspaceGas(
  input: GenericSendWriteInput,
  client: EspaceClient,
  from: string,
  data: Hex,
) {
  if (input.gas !== undefined) return Promise.resolve(input.gas);
  const request = {
    from,
    to: input.address as `0x${string}`,
    data,
    ...(input.value !== undefined ? { value: input.value } : {}),
  };
  return client.estimateGas(request as never);
}

async function fetchEspaceBaseFee(client: EspaceClient): Promise<bigint> {
  try {
    const block = await client.getBlock('latest');
    return (block as unknown as { baseFeePerGas?: bigint }).baseFeePerGas ?? 1_000_000_000n;
  } catch {
    return 1_000_000_000n;
  }
}
