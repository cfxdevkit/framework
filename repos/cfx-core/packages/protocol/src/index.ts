import type { Client, CoreLog, CoreLogFilter, Hash, TxReceipt, TxRequest } from '@cfxdevkit/core';

export const __packageName = '@cfxdevkit/protocol' as const;

export {
  automationManagerAbi as AUTOMATION_MANAGER_ABI,
  automationManagerAbi,
  automationManagerAddress,
  automationManagerBytecode,
  automationManagerConfig,
  permitHandlerAbi as PERMIT_HANDLER_ABI,
  permitHandlerAbi,
  permitHandlerAddress,
  permitHandlerBytecode,
  permitHandlerConfig,
  swappiPriceAdapterAbi as SWAPPI_PRICE_ADAPTER_ABI,
  swappiPriceAdapterAbi,
  swappiPriceAdapterAddress,
  swappiPriceAdapterBytecode,
  swappiPriceAdapterConfig,
} from './abi.js';
export {
  ADMIN_CONTROL_ABI,
  adminControlAbi,
  adminControlAddress,
  CFX_NATIVE_ADDRESS,
  CONFLUX_PRECOMPILE_ADDRESSES,
  CONFLUX_PRECOMPILE_ADDRESSES as PRECOMPILE_ADDRESSES,
  CROSS_SPACE_CALL_ABI,
  crossSpaceCallAbi,
  crossSpaceCallAddress,
  POS_REGISTER_ABI,
  posRegisterAbi,
  posRegisterAddress,
  SPONSOR_WHITELIST_ABI,
  STAKING_ABI,
  sponsorWhitelistAbi,
  sponsorWhitelistAddress,
  stakingAbi,
  stakingAddress,
  WCFX_ABI,
  WCFX_ADDRESSES,
  wcfxAbi,
  wcfxAddresses,
} from './precompiles.js';

export interface WaitForReceiptOptions {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface ChainProgress {
  family: Client['family'];
  chainId: number;
  height: bigint;
}

export interface GasEstimate {
  gas: bigint;
  storageCollateral?: bigint;
}

export function isSuccessfulReceipt(receipt: TxReceipt): boolean {
  const status = (receipt as unknown as { status?: unknown }).status;
  return (
    status === undefined ||
    status === 'success' ||
    status === 1 ||
    status === 0n ||
    status === '0x0'
  );
}

export function assertSuccessfulReceipt(receipt: TxReceipt, hash?: Hash): TxReceipt {
  if (isSuccessfulReceipt(receipt)) return receipt;
  const status = String((receipt as unknown as { status?: unknown }).status);
  throw new Error(`transaction${hash ? ` ${hash}` : ''} reverted (status=${status})`);
}

export async function waitForTransactionReceipt(
  client: Client,
  hash: Hash,
  options: WaitForReceiptOptions = {},
): Promise<TxReceipt> {
  const intervalMs = options.intervalMs ?? 1_000;
  const deadline = Date.now() + (options.timeoutMs ?? 60_000);

  while (Date.now() <= deadline) {
    if (options.signal?.aborted) throw options.signal.reason ?? new Error('receipt wait aborted');
    const receipt = await client.getTransactionReceipt(
      hash,
      options.signal ? { signal: options.signal } : {},
    );
    if (receipt) return assertSuccessfulReceipt(receipt, hash);
    await delay(intervalMs, options.signal);
  }

  throw new Error(`receipt for ${hash} not found within ${options.timeoutMs ?? 60_000}ms`);
}

export async function getChainProgress(client: Client): Promise<ChainProgress> {
  const height =
    client.family === 'core' ? await client.getEpochNumber() : await client.getBlockNumber();
  return { family: client.family, chainId: client.chain.id, height };
}

export async function estimateTransaction(
  client: Client,
  request: TxRequest,
): Promise<GasEstimate> {
  if (client.family === 'espace') return { gas: await client.estimateGas(request) };
  const result = await client.request<{
    gasUsed?: string | bigint;
    gasLimit?: string | bigint;
    storageCollateralized?: string | bigint;
  }>({
    method: 'cfx_estimateGasAndCollateral',
    params: [request],
  });
  const estimate: GasEstimate = { gas: toBigInt(result.gasUsed ?? result.gasLimit ?? 0n) };
  if (result.storageCollateralized !== undefined) {
    estimate.storageCollateral = toBigInt(result.storageCollateralized);
  }
  return estimate;
}

export async function collectLogs(client: Client, filter: CoreLogFilter): Promise<CoreLog[]> {
  if (client.family !== 'core') {
    throw new Error(
      'collectLogs currently accepts Core Space clients; use eth_getLogs through client.request for eSpace',
    );
  }
  return client.getLogs(filter);
}

function toBigInt(value: string | bigint): bigint {
  return typeof value === 'bigint' ? value : BigInt(value);
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}
