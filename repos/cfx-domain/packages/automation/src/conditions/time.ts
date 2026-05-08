import type { DCAParams, Job } from '../types.js';

export const DEFAULT_DCA_DUE_BUFFER_SECONDS = 15;

export function isDCADue(
  params: DCAParams,
  nowSec: number,
  bufferSec = DEFAULT_DCA_DUE_BUFFER_SECONDS,
): boolean {
  if (params.swapsCompleted >= params.totalSwaps) return false;
  return nowSec + bufferSec >= params.nextExecution;
}

export function isExpired(job: Job, nowSec: number): boolean {
  return job.expiresAt !== undefined && nowSec >= Math.floor(job.expiresAt / 1_000);
}
