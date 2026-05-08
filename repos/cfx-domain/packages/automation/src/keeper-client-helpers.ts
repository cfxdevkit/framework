import type { Hex, TxReceipt } from '@cfxdevkit/core';
import type { HexHash, OnChainJobStatus } from './types.js';

export function requireOnChainJobId(jobId: HexHash | undefined, localJobId: string): HexHash {
  if (jobId) return jobId;
  throw new Error(`job ${localJobId} does not have an on-chain job id`);
}

export function statusToOnChainStatus(status: number): OnChainJobStatus {
  if (status === 0) return 'active';
  if (status === 1) return 'executed';
  if (status === 2) return 'cancelled';
  if (status === 3) return 'expired';
  return 'cancelled';
}

export function receiptToSwapReceipt(receipt: TxReceipt) {
  const status = (receipt as unknown as { status?: 'success' | 'reverted' }).status;
  return {
    ...(status !== undefined ? { status } : {}),
    logs: (
      (receipt as unknown as { logs?: readonly { topics: readonly Hex[]; data: Hex }[] }).logs ?? []
    ).map((log) => ({ topics: log.topics, data: log.data })),
  };
}
