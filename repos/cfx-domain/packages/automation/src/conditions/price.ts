import type { DCAJob, LimitOrderJob } from '../types.js';
import { isDCADue } from './time.js';

export const PRICE_SCALE = 10n ** 18n;

export interface PriceSource {
  getPrice(tokenIn: string, tokenOut: string): Promise<bigint>;
}

export interface LimitOrderCheckResult {
  conditionMet: boolean;
  currentPrice: bigint;
  targetPrice: bigint;
  estimatedSwapUsd?: number;
}

export interface DCACheckResult {
  conditionMet: boolean;
  nextExecution: number;
  estimatedSwapUsd?: number;
}

export class PriceChecker {
  constructor(readonly source: PriceSource) {}

  async checkLimitOrder(job: LimitOrderJob): Promise<LimitOrderCheckResult> {
    const currentPrice = await this.source.getPrice(job.params.tokenIn, job.params.tokenOut);
    const conditionMet =
      job.params.direction === 'gte'
        ? currentPrice >= job.params.targetPrice
        : currentPrice <= job.params.targetPrice;
    return {
      conditionMet,
      currentPrice,
      targetPrice: job.params.targetPrice,
      estimatedSwapUsd: estimateUsdValue(job.params.amountIn, currentPrice),
    };
  }

  async checkDCA(job: DCAJob, nowSec = Math.floor(Date.now() / 1_000)): Promise<DCACheckResult> {
    const currentPrice = await this.source.getPrice(job.params.tokenIn, job.params.tokenOut);
    return {
      conditionMet: isDCADue(job.params, nowSec),
      nextExecution: job.params.nextExecution,
      estimatedSwapUsd: estimateUsdValue(job.params.amountPerSwap, currentPrice),
    };
  }
}

export function estimateUsdValue(amount: bigint, price: bigint, tokenDecimals = 18): number {
  const decimalScale = 10n ** BigInt(tokenDecimals);
  const scaledUsd = (amount * price) / decimalScale;
  return Number(scaledUsd) / Number(PRICE_SCALE);
}
