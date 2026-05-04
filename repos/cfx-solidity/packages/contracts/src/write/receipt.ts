import type { Client, Hex, TxReceipt } from '@cfxdevkit/core';
import { ContractsError } from '../errors/index.js';

export async function waitForReceipt(
  client: Client,
  hash: Hex,
  opts: { pollIntervalMs: number; timeoutMs: number },
): Promise<TxReceipt> {
  const deadline = Date.now() + opts.timeoutMs;
  while (Date.now() < deadline) {
    const receipt =
      client.family === 'espace'
        ? await client.getTransactionReceipt(hash)
        : await client.request<TxReceipt | null>({
            method: 'cfx_getTransactionReceipt',
            params: [hash],
          });
    if (receipt) {
      assertSuccessfulReceipt(receipt, hash);
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

function assertSuccessfulReceipt(receipt: TxReceipt, hash: Hex) {
  const status = (receipt as unknown as { status?: unknown }).status;
  const ok =
    status === 'success' ||
    status === 1 ||
    status === '0x0' ||
    status === 0n ||
    status === undefined;
  if (!ok) {
    throw new ContractsError({
      code: 'contracts/reverted',
      message: `transaction ${hash} reverted (status=${String(status)})`,
      meta: { hash, status: String(status) },
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
