export type HexAddress = `0x${string}`;
export type HexHash = `0x${string}`;

export type JobType = 'limit_order' | 'dca' | 'twap' | 'swap';

export type JobStatus =
  | 'pending'
  | 'active'
  | 'executed'
  | 'cancelled'
  | 'failed'
  | 'expired'
  | 'paused';

export type TriggerDirection = 'gte' | 'lte';

export interface BaseJobParams {
  tokenIn: HexAddress;
  tokenOut: HexAddress;
  slippageBps?: number;
}

export interface LimitOrderParams extends BaseJobParams {
  amountIn: bigint;
  minAmountOut: bigint;
  targetPrice: bigint;
  direction: TriggerDirection;
}

export interface DCAParams extends BaseJobParams {
  amountPerSwap: bigint;
  intervalSeconds: number;
  totalSwaps: number;
  swapsCompleted: number;
  nextExecution: number;
}

export interface TWAPParams extends BaseJobParams {
  amountIn: bigint;
  minAmountOut: bigint;
  trancheCount: number;
  trancheIntervalSeconds: number;
  tranchesCompleted: number;
  nextExecution: number;
}

export interface SwapParams extends BaseJobParams {
  amountIn: bigint;
  minAmountOut: bigint;
}

export interface BaseJob<TType extends JobType, TParams> {
  id: string;
  owner: HexAddress;
  type: TType;
  status: JobStatus;
  params: TParams;
  createdAt: number;
  updatedAt: number;
  retries: number;
  maxRetries: number;
  onChainJobId?: HexHash;
  expiresAt?: number;
  lastError?: string;
  txHash?: HexHash;
}

export type LimitOrderJob = BaseJob<'limit_order', LimitOrderParams>;
export type DCAJob = BaseJob<'dca', DCAParams>;
export type TWAPJob = BaseJob<'twap', TWAPParams>;
export type SwapJob = BaseJob<'swap', SwapParams>;
export type Job = LimitOrderJob | DCAJob | TWAPJob | SwapJob;

export type ExecutableJob = LimitOrderJob | DCAJob | TWAPJob | SwapJob;

export type OnChainJobStatus = 'active' | 'executed' | 'cancelled' | 'expired';

export interface ExecuteResult {
  txHash: HexHash;
  amountOut?: bigint;
  nextExecutionSec?: number;
}

export interface TickResult {
  jobId: string;
  skipped: boolean;
  reason?: string;
  result?: ExecuteResult;
}

export interface EvalResult {
  shouldExecute: boolean;
  reason?: string;
  estimatedSwapUsd?: number;
  currentPrice?: bigint;
}

export function isExecutableJob(job: Job): job is ExecutableJob {
  return (
    job.type === 'limit_order' || job.type === 'dca' || job.type === 'twap' || job.type === 'swap'
  );
}
