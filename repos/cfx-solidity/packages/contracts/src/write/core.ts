import type { CoreSpaceClient, Hex, SignableTx } from '@cfxdevkit/core';
import type { Abi, ContractFunctionName } from 'viem';
import { encodeFunctionData, hexToBigInt, toHex } from 'viem';
import { ContractsError } from '../errors/index.js';
import type { SendWriteInput, SendWriteResult } from './index.js';
import { waitForReceipt } from './receipt.js';

interface CoreEstimate {
  gasLimit: Hex;
  storageCollateralized: Hex;
}

type GenericSendWriteInput = SendWriteInput<
  Abi,
  ContractFunctionName<Abi, 'nonpayable' | 'payable'>
>;

export async function sendCoreWrite(
  input: GenericSendWriteInput,
  client: CoreSpaceClient,
): Promise<SendWriteResult> {
  if (/^0x[0-9a-fA-F]+$/.test(input.address)) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message: `Expected base32 address for Core Space, got 0x-hex: ${input.address}`,
      meta: { address: input.address, family: 'core' },
    });
  }
  const fromBase32 = (input.signer.account as unknown as { coreAddress?: string }).coreAddress;
  if (!fromBase32) {
    throw new ContractsError({
      code: 'contracts/invalid-argument',
      message:
        'Signer.account.coreAddress is required for Core Space writes (use a dual-address account).',
      meta: { family: 'core' },
    });
  }
  const baseData = encodeFunctionData({
    abi: input.abi,
    functionName: input.functionName,
    ...(input.args !== undefined ? { args: input.args } : {}),
  } as Parameters<typeof encodeFunctionData>[0]) as Hex;
  const callObject: Record<string, unknown> = {
    from: fromBase32,
    to: input.address,
    data: baseData,
  };
  if (input.value !== undefined) callObject.value = toHex(input.value);
  const [nonceHex, estimate, gasPriceHex, epochHex] = await Promise.all([
    input.nonce !== undefined
      ? Promise.resolve(toHex(input.nonce) as Hex)
      : client.request<Hex>({ method: 'cfx_getNextNonce', params: [fromBase32, 'latest_state'] }),
    estimateCoreGas(input, client, callObject),
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
    to: input.address,
    data: baseData,
    nonce: Number(hexToBigInt(nonceHex)),
    gas: input.gas ?? hexToBigInt(estimate.gasLimit),
    storageLimit: input.storageLimit ?? hexToBigInt(estimate.storageCollateralized),
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
  const out: SendWriteResult = { hash, request: tx, rawTransaction };
  if (input.waitForReceipt)
    out.receipt = await waitForReceipt(client, hash, {
      pollIntervalMs: input.pollIntervalMs ?? 1500,
      timeoutMs: input.receiptTimeoutMs ?? 60_000,
    });
  return out;
}

function estimateCoreGas(
  input: GenericSendWriteInput,
  client: CoreSpaceClient,
  callObject: Record<string, unknown>,
) {
  if (input.gas !== undefined && input.storageLimit !== undefined) {
    return Promise.resolve({
      gasLimit: toHex(input.gas) as Hex,
      storageCollateralized: toHex(input.storageLimit) as Hex,
    } satisfies CoreEstimate);
  }
  return client.request<CoreEstimate>({
    method: 'cfx_estimateGasAndCollateral',
    params: [callObject, 'latest_state'],
  });
}
