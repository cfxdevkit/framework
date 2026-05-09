import type {
  DCAParams,
  ExecuteResult,
  ExecutionRecord,
  Job,
  JobStatus,
  JobType,
  LimitOrderParams,
  SwapParams,
  TWAPParams,
} from '@cfxdevkit/automation';

export type CasHexAddress = `0x${string}`;
export type CasHexHash = `0x${string}`;
export type CasJobType = JobType;
export type CasJobStatus = JobStatus;

export interface CasBaseJobRequest {
  tokenIn: CasHexAddress;
  tokenOut: CasHexAddress;
  slippageBps?: number;
  maxRetries?: number;
  expiresAt?: number;
  onChainJobId?: CasHexHash;
}

export interface CasLimitOrderRequest extends CasBaseJobRequest {
  type: 'limit_order';
  amountIn: string;
  minAmountOut: string;
  targetPrice: string;
  direction: 'gte' | 'lte';
}

export interface CasDcaRequest extends CasBaseJobRequest {
  type: 'dca';
  amountPerSwap: string;
  intervalSeconds: number;
  totalSwaps: number;
  nextExecution: number;
}

export interface CasTwapRequest extends CasBaseJobRequest {
  type: 'twap';
  amountIn: string;
  minAmountOut: string;
  trancheCount: number;
  trancheIntervalSeconds: number;
  nextExecution: number;
}

export interface CasSwapRequest extends CasBaseJobRequest {
  type: 'swap';
  amountIn: string;
  minAmountOut: string;
}

export type CasCreateJobRequest =
  | CasLimitOrderRequest
  | CasDcaRequest
  | CasTwapRequest
  | CasSwapRequest;

export type CasLimitOrderParamsDto = StringifyBigints<LimitOrderParams>;
export type CasDcaParamsDto = StringifyBigints<DCAParams>;
export type CasTwapParamsDto = StringifyBigints<TWAPParams>;
export type CasSwapParamsDto = StringifyBigints<SwapParams>;

export type CasJobParamsDto =
  | CasLimitOrderParamsDto
  | CasDcaParamsDto
  | CasTwapParamsDto
  | CasSwapParamsDto;

export interface CasJobDto {
  id: string;
  owner: CasHexAddress;
  type: CasJobType;
  status: CasJobStatus;
  params: CasJobParamsDto;
  createdAt: number;
  updatedAt: number;
  retries: number;
  maxRetries: number;
  onChainJobId?: CasHexHash;
  expiresAt?: number;
  lastError?: string;
  txHash?: CasHexHash;
}

export interface CasExecutionDto {
  id: number;
  jobId: string;
  txHash: CasHexHash;
  timestamp: number;
  amountOut?: string;
}

export interface CasExecuteResultDto {
  txHash: CasHexHash;
  amountOut?: string;
  nextExecutionSec?: number;
}

type StringifyBigints<T> = {
  [K in keyof T]: T[K] extends bigint ? string : T[K];
};

export function jobToCasDto(job: Job): CasJobDto {
  return {
    id: job.id,
    owner: job.owner,
    type: job.type,
    status: job.status,
    params: stringifyBigints(job.params) as CasJobParamsDto,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    retries: job.retries,
    maxRetries: job.maxRetries,
    ...(job.onChainJobId ? { onChainJobId: job.onChainJobId } : {}),
    ...(job.expiresAt !== undefined ? { expiresAt: job.expiresAt } : {}),
    ...(job.lastError ? { lastError: job.lastError } : {}),
    ...(job.txHash ? { txHash: job.txHash } : {}),
  };
}

export function executionToCasDto(record: ExecutionRecord): CasExecutionDto {
  return {
    id: record.id,
    jobId: record.jobId,
    txHash: record.txHash,
    timestamp: record.timestamp,
    ...(record.amountOut !== undefined ? { amountOut: record.amountOut.toString() } : {}),
  };
}

export function executeResultToCasDto(result: ExecuteResult): CasExecuteResultDto {
  return {
    txHash: result.txHash,
    ...(result.amountOut !== undefined ? { amountOut: result.amountOut.toString() } : {}),
    ...(result.nextExecutionSec !== undefined ? { nextExecutionSec: result.nextExecutionSec } : {}),
  };
}

function stringifyBigints<T extends object>(value: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      typeof entry === 'bigint' ? entry.toString() : entry,
    ]),
  );
}
