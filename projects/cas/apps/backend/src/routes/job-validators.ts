import type { NewJobInput } from '@cfxdevkit/automation';
import type { CasCreateJobRequest, CasJobStatus, CasJobType } from '@cfxdevkit/cas-shared';
import type { Response } from 'express';
import { isAddress } from 'viem';

export const JOB_TYPES: ReadonlySet<CasJobType> = new Set(['limit_order', 'dca', 'twap', 'swap']);
export const JOB_STATUSES: ReadonlySet<CasJobStatus> = new Set([
  'pending',
  'active',
  'executed',
  'cancelled',
  'failed',
  'expired',
  'paused',
]);

export function normalizeOptionalFilter<T extends string>(
  value: unknown,
  allowed: ReadonlySet<T>,
  label: string,
  res: Response,
): T | undefined | false {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !allowed.has(value as T)) {
    res.status(400).json({ error: `${label} is not supported` });
    return false;
  }
  return value as T;
}

export function readRouteParam(value: string | string[] | undefined): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function parseCreateJobInput(
  body: unknown,
  owner: string,
): { value: NewJobInput } | { error: string } {
  if (!isObject(body)) return { error: 'request body must be an object' };
  if (typeof body.type !== 'string' || !isJobType(body.type)) {
    return { error: 'type must be one of limit_order, dca, twap or swap' };
  }
  if (
    typeof body.tokenIn !== 'string' ||
    typeof body.tokenOut !== 'string' ||
    !isAddress(body.tokenIn) ||
    !isAddress(body.tokenOut)
  ) {
    return { error: 'tokenIn and tokenOut must be valid EVM addresses' };
  }

  const common = parseCommonFields(body, owner);
  if ('error' in common) return common;
  const request = body as unknown as CasCreateJobRequest;

  try {
    if (request.type === 'limit_order') {
      return {
        value: {
          ...common.value,
          type: request.type,
          params: {
            ...baseParams(request),
            amountIn: parseUintString(request.amountIn, 'amountIn'),
            minAmountOut: parseUintString(request.minAmountOut, 'minAmountOut'),
            targetPrice: parseUintString(request.targetPrice, 'targetPrice'),
            direction: request.direction === 'lte' ? 'lte' : 'gte',
          },
        },
      };
    }

    if (request.type === 'dca') {
      return {
        value: {
          ...common.value,
          type: request.type,
          params: {
            ...baseParams(request),
            amountPerSwap: parseUintString(request.amountPerSwap, 'amountPerSwap'),
            intervalSeconds: parsePositiveInteger(request.intervalSeconds, 'intervalSeconds'),
            totalSwaps: parsePositiveInteger(request.totalSwaps, 'totalSwaps'),
            swapsCompleted: 0,
            nextExecution: parseNonNegativeInteger(request.nextExecution, 'nextExecution'),
          },
        },
      };
    }

    if (request.type === 'twap') {
      return {
        value: {
          ...common.value,
          type: request.type,
          params: {
            ...baseParams(request),
            amountIn: parseUintString(request.amountIn, 'amountIn'),
            minAmountOut: parseUintString(request.minAmountOut, 'minAmountOut'),
            trancheCount: parsePositiveInteger(request.trancheCount, 'trancheCount'),
            trancheIntervalSeconds: parsePositiveInteger(
              request.trancheIntervalSeconds,
              'trancheIntervalSeconds',
            ),
            tranchesCompleted: 0,
            nextExecution: parseNonNegativeInteger(request.nextExecution, 'nextExecution'),
          },
        },
      };
    }

    return {
      value: {
        ...common.value,
        type: request.type,
        params: {
          ...baseParams(request),
          amountIn: parseUintString(request.amountIn, 'amountIn'),
          minAmountOut: parseUintString(request.minAmountOut, 'minAmountOut'),
        },
      },
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'invalid job request' };
  }
}

// ── Private helpers ──────────────────────────────────────────────────────────

function parseCommonFields(
  body: Record<string, unknown>,
  owner: string,
): { value: Omit<NewJobInput, 'type' | 'params'> } | { error: string } {
  try {
    return {
      value: {
        owner: owner as `0x${string}`,
        status: 'pending',
        maxRetries:
          body.maxRetries === undefined
            ? 5
            : parseNonNegativeInteger(body.maxRetries, 'maxRetries'),
        ...(body.expiresAt !== undefined
          ? { expiresAt: parseNonNegativeInteger(body.expiresAt, 'expiresAt') }
          : {}),
        ...(typeof body.onChainJobId === 'string' && body.onChainJobId.startsWith('0x')
          ? { onChainJobId: body.onChainJobId as `0x${string}` }
          : {}),
      },
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'invalid common fields' };
  }
}

function baseParams(request: CasCreateJobRequest) {
  return {
    tokenIn: request.tokenIn,
    tokenOut: request.tokenOut,
    ...(request.slippageBps !== undefined
      ? { slippageBps: parseNonNegativeInteger(request.slippageBps, 'slippageBps') }
      : {}),
  };
}

function parseUintString(value: unknown, field: string): bigint {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new Error(`${field} must be a base-10 integer string`);
  }
  return BigInt(value);
}

function parsePositiveInteger(value: unknown, field: string): number {
  const parsed = parseNonNegativeInteger(value, field);
  if (parsed <= 0) throw new Error(`${field} must be greater than zero`);
  return parsed;
}

function parseNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJobType(value: string): value is CasJobType {
  return JOB_TYPES.has(value as CasJobType);
}
