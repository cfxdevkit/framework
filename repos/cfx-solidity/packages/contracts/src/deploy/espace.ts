import type { EspaceClient, Hex, SignableTx } from '@cfxdevkit/cdk';
import type { Abi } from 'viem';
import { encodeDeployData, hexToBigInt } from 'viem';
import { waitForReceipt } from '../write/index.js';
import type { DeployContractInput, DeployContractResult } from './types.js';

export async function deployEspaceContract<TAbi extends Abi>(
  input: DeployContractInput<TAbi>,
  client: EspaceClient,
): Promise<DeployContractResult> {
  const data = encodeDeployData({
    abi: input.abi,
    bytecode: input.bytecode,
    ...(input.args !== undefined ? { args: input.args } : {}),
  } as Parameters<typeof encodeDeployData>[0]) as Hex;

  const chainId = client.chain.id;
  const from = input.signer.account.address;

  const [nonceHex, gasEstimate] = await Promise.all([
    client.request<Hex>({ method: 'eth_getTransactionCount', params: [from, 'pending'] }),
    input.gas !== undefined
      ? Promise.resolve(input.gas)
      : client.estimateGas({
          from,
          data,
          ...(input.value !== undefined ? { value: input.value } : {}),
        } as never),
  ]);

  const gas = input.gas !== undefined ? input.gas : (gasEstimate * 125n) / 100n;
  const baseFee = await fetchEspaceBaseFee(client);
  const maxPriorityFeePerGas = input.maxPriorityFeePerGas ?? 1_000_000_000n;
  const maxFeePerGas = input.maxFeePerGas ?? baseFee * 2n + maxPriorityFeePerGas;

  const tx: SignableTx = {
    family: 'espace',
    chainId,
    data,
    nonce: Number(hexToBigInt(nonceHex)),
    gas,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
  if (input.value !== undefined) tx.value = input.value;

  const rawTransaction = (await input.signer.signTransaction(tx, input.signOptions ?? {})) as Hex;
  const hash = await client.request<Hex>({
    method: 'eth_sendRawTransaction',
    params: [rawTransaction],
  });

  const out: DeployContractResult = { hash, request: tx, rawTransaction };
  if (input.waitForReceipt) {
    const receipt = await waitForReceipt(client, hash, {
      pollIntervalMs: input.pollIntervalMs ?? 1500,
      timeoutMs: input.receiptTimeoutMs ?? 60_000,
    });
    out.receipt = receipt;
    const created =
      (receipt as unknown as { contractAddress?: string }).contractAddress ?? undefined;
    if (created) out.address = created;
  }
  return out;
}

async function fetchEspaceBaseFee(client: EspaceClient): Promise<bigint> {
  try {
    const block = await client.getBlock('latest');
    const baseFee = (block as unknown as { baseFeePerGas?: bigint }).baseFeePerGas;
    return baseFee ?? 1_000_000_000n;
  } catch {
    return 1_000_000_000n;
  }
}
