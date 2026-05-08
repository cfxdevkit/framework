import type { ExecuteResult, HexAddress, HexHash, Job } from '../types.js';

type JobRow = {
  id: string;
  owner: string;
  type: Job['type'];
  status: Job['status'];
  paramsJson: string;
  onChainJobId: string | null;
  createdAt: number;
  updatedAt: number;
  expiresAt: number | null;
  retries: number;
  maxRetries: number;
  lastError: string | null;
  txHash: string | null;
};

export function serializeParams(params: Job['params']): string {
  return JSON.stringify(params, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value,
  );
}

export function jobToRow(job: Job): JobRow {
  return {
    id: job.id,
    owner: job.owner,
    type: job.type,
    status: job.status,
    paramsJson: serializeParams(job.params),
    onChainJobId: job.onChainJobId ?? null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    expiresAt: job.expiresAt ?? null,
    retries: job.retries,
    maxRetries: job.maxRetries,
    lastError: job.lastError ?? null,
    txHash: job.txHash ?? null,
  };
}

export function rowToJob(row: JobRow): Job {
  const base = {
    id: row.id,
    owner: row.owner as HexAddress,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    retries: row.retries,
    maxRetries: row.maxRetries,
    ...(row.onChainJobId ? { onChainJobId: row.onChainJobId as HexHash } : {}),
    ...(row.expiresAt !== null ? { expiresAt: row.expiresAt } : {}),
    ...(row.lastError !== null ? { lastError: row.lastError } : {}),
    ...(row.txHash !== null ? { txHash: row.txHash as HexHash } : {}),
  };

  const params = JSON.parse(row.paramsJson) as Record<string, unknown>;
  if (row.type === 'limit_order') {
    return {
      ...base,
      type: 'limit_order',
      params: {
        tokenIn: params.tokenIn as HexAddress,
        tokenOut: params.tokenOut as HexAddress,
        amountIn: BigInt(params.amountIn as string),
        minAmountOut: BigInt(params.minAmountOut as string),
        targetPrice: BigInt(params.targetPrice as string),
        direction: params.direction as 'gte' | 'lte',
        ...(params.slippageBps !== undefined ? { slippageBps: Number(params.slippageBps) } : {}),
      },
    };
  }
  if (row.type === 'dca') {
    return {
      ...base,
      type: 'dca',
      params: {
        tokenIn: params.tokenIn as HexAddress,
        tokenOut: params.tokenOut as HexAddress,
        amountPerSwap: BigInt(params.amountPerSwap as string),
        intervalSeconds: Number(params.intervalSeconds),
        totalSwaps: Number(params.totalSwaps),
        swapsCompleted: Number(params.swapsCompleted),
        nextExecution: Number(params.nextExecution),
        ...(params.slippageBps !== undefined ? { slippageBps: Number(params.slippageBps) } : {}),
      },
    };
  }
  if (row.type === 'twap') {
    return {
      ...base,
      type: 'twap',
      params: {
        tokenIn: params.tokenIn as HexAddress,
        tokenOut: params.tokenOut as HexAddress,
        amountIn: BigInt(params.amountIn as string),
        minAmountOut: BigInt(params.minAmountOut as string),
        trancheCount: Number(params.trancheCount),
        trancheIntervalSeconds: Number(params.trancheIntervalSeconds),
        tranchesCompleted: Number(params.tranchesCompleted),
        nextExecution: Number(params.nextExecution),
        ...(params.slippageBps !== undefined ? { slippageBps: Number(params.slippageBps) } : {}),
      },
    };
  }
  return {
    ...base,
    type: 'swap',
    params: {
      tokenIn: params.tokenIn as HexAddress,
      tokenOut: params.tokenOut as HexAddress,
      amountIn: BigInt(params.amountIn as string),
      minAmountOut: BigInt(params.minAmountOut as string),
      ...(params.slippageBps !== undefined ? { slippageBps: Number(params.slippageBps) } : {}),
    },
  };
}

export function resultToUpdate(result: ExecuteResult) {
  return { status: 'executed' as const, txHash: result.txHash };
}
