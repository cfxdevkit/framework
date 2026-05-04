import type { CoreSpaceClient, Hex, SignableTx } from '@cfxdevkit/core';
import type { Abi } from 'viem';
import { encodeDeployData, hexToBigInt, toHex } from 'viem';
import { ContractsError } from '../errors/index.js';
import { waitForReceipt } from '../write/index.js';
import type { DeployContractInput, DeployContractResult } from './types.js';

interface CoreEstimate {
  gasLimit: Hex;
  storageCollateralized: Hex;
}

export async function deployCoreContract<TAbi extends Abi>(
  input: DeployContractInput<TAbi>,
  client: CoreSpaceClient,
): Promise<DeployContractResult> {
  const fromBase32 = (input.signer.account as unknown as { coreAddress?: string }).coreAddress;
  if (!fromBase32) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message:
        'Signer.account.coreAddress is required for Core Space deploys (use a dual-address account).',
      meta: { family: 'core' },
    });
  }

  const data = encodeDeployData({
    abi: input.abi,
    bytecode: input.bytecode,
    ...(input.args !== undefined ? { args: input.args } : {}),
  } as Parameters<typeof encodeDeployData>[0]) as Hex;

  const callObject: Record<string, unknown> = { from: fromBase32, data };
  if (input.value !== undefined) callObject.value = toHex(input.value);

  const [nonceHex, estimate, gasPriceHex, epochHex] = await Promise.all([
    client.request<Hex>({ method: 'cfx_getNextNonce', params: [fromBase32, 'latest_state'] }),
    input.gas !== undefined && input.storageLimit !== undefined
      ? Promise.resolve({
          gasLimit: toHex(input.gas) as Hex,
          storageCollateralized: toHex(input.storageLimit) as Hex,
        } satisfies CoreEstimate)
      : client.request<CoreEstimate>({
          method: 'cfx_estimateGasAndCollateral',
          params: [callObject, 'latest_state'],
        }),
    input.gasPrice !== undefined
      ? Promise.resolve(toHex(input.gasPrice) as Hex)
      : client.request<Hex>({ method: 'cfx_gasPrice' }),
    input.epochHeight !== undefined
      ? Promise.resolve(toHex(input.epochHeight) as Hex)
      : client.request<Hex>({ method: 'cfx_epochNumber', params: ['latest_state'] }),
  ]);

  const tx: SignableTx = {
    family: 'core',
    chainId: client.chain.id,
    data,
    nonce: Number(hexToBigInt(nonceHex)),
    gas: input.gas !== undefined ? input.gas : (hexToBigInt(estimate.gasLimit) * 125n) / 100n,
    storageLimit:
      input.storageLimit !== undefined
        ? input.storageLimit
        : (hexToBigInt(estimate.storageCollateralized) * 125n) / 100n,
    epochHeight: hexToBigInt(epochHex),
    gasPrice: hexToBigInt(gasPriceHex),
    coreType: input.coreType ?? 'cip2930',
  };
  if (input.value !== undefined) tx.value = input.value;

  const rawTransaction = (await input.signer.signTransaction(tx, input.signOptions ?? {})) as Hex;
  const hash = await client.request<Hex>({
    method: 'cfx_sendRawTransaction',
    params: [rawTransaction],
  });

  const out: DeployContractResult = { hash, request: tx, rawTransaction };
  if (input.waitForReceipt) {
    const receipt = await waitForReceipt(client, hash, {
      pollIntervalMs: input.pollIntervalMs ?? 1500,
      timeoutMs: input.receiptTimeoutMs ?? 60_000,
    });
    out.receipt = receipt;
    const created = receipt as unknown as {
      contractCreated?: string;
      contractAddress?: string;
    };
    const addr = created.contractCreated ?? created.contractAddress;
    if (addr) out.address = addr;
  }
  return out;
}
