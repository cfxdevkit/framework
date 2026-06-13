/**
 * Standalone helpers: error formatting and the manual WCFX wrap/unwrap flow.
 * Kept separate from strategy-chain.ts to limit per-file line count.
 */

import type { CasHexAddress } from '@cfxdevkit/cas-shared';
import { WCFX_ABI } from '@cfxdevkit/cas-shared';
import type { WagmiPublicClient, WriteContractFn } from '../strategy-chain';

// ── Error parser ──────────────────────────────────────────────────────────────

export function parseStrategyError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  // Collapse long viem/wagmi error trees to the first meaningful line
  const first = raw.split('\n').find((l) => l.trim().length > 0) ?? raw;
  const msg = first.length > 300 ? `${first.slice(0, 300)}…` : first;

  if (msg.includes('TooManyJobs')) return 'You have reached the maximum number of active jobs.';
  if (msg.includes('SlippageTooHigh')) return 'Slippage is above the contract maximum.';
  if (msg.includes('InvalidParams'))
    return 'Invalid strategy parameters. Check the amounts, tokens, and timing.';
  if (msg.includes('User rejected') || msg.includes('user rejected'))
    return 'Transaction was rejected in your wallet.';
  if (msg.includes('insufficient funds')) return 'Insufficient funds for gas or token transfer.';
  if (msg.includes('timed out') || msg.includes('could not be found'))
    return 'Transaction confirmation timed out. It may still confirm in your wallet.';
  return msg;
}

// ── Manual WCFX wrap / unwrap ─────────────────────────────────────────────────

export async function wrapOrUnwrapCfx(options: {
  account: CasHexAddress;
  wcfxAddress: CasHexAddress;
  amount: bigint;
  mode: 'wrap' | 'unwrap';
  publicClient: WagmiPublicClient;
  writeContractAsync: WriteContractFn;
}): Promise<void> {
  const { wcfxAddress, amount, mode, publicClient, writeContractAsync } = options;
  if (amount <= 0n) throw new Error('Enter an amount greater than zero.');

  const hash =
    mode === 'wrap'
      ? await writeContractAsync({
          address: wcfxAddress,
          abi: WCFX_ABI,
          functionName: 'deposit',
          value: amount,
        })
      : await writeContractAsync({
          address: wcfxAddress,
          abi: WCFX_ABI,
          functionName: 'withdraw',
          args: [amount],
        });

  await publicClient.waitForTransactionReceipt({
    hash,
    pollingInterval: 2_000,
    timeout: 120_000,
  });
}
