import { estimateUsdValue } from '../conditions/price.js';
import type { EvalResult, TWAPJob } from '../types.js';
import type { StrategyEvalContext, StrategyEvaluator } from './types.js';

export class TWAPEvaluator implements StrategyEvaluator<TWAPJob> {
  async evaluate(job: TWAPJob, context: StrategyEvalContext): Promise<EvalResult> {
    if (job.params.tranchesCompleted >= job.params.trancheCount) {
      return { shouldExecute: false, reason: 'twap_completed' };
    }
    if (context.nowSec < job.params.nextExecution) {
      return { shouldExecute: false, reason: 'twap_interval_not_elapsed' };
    }

    const estimatedSwapUsd = await estimateTwapTrancheUsd(job, context);
    const safety = context.safetyGuard.check(job, {
      nowSec: context.nowSec,
      ...(estimatedSwapUsd !== undefined ? { estimatedSwapUsd } : {}),
    });
    if (!safety.ok) {
      return {
        shouldExecute: false,
        reason: safety.violations.map((violation) => violation.rule).join(','),
        ...(estimatedSwapUsd !== undefined ? { estimatedSwapUsd } : {}),
      };
    }
    return { shouldExecute: true, ...(estimatedSwapUsd !== undefined ? { estimatedSwapUsd } : {}) };
  }
}

async function estimateTwapTrancheUsd(
  job: TWAPJob,
  context: StrategyEvalContext,
): Promise<number | undefined> {
  if (job.params.trancheCount <= 0) return undefined;
  const trancheAmount = job.params.amountIn / BigInt(job.params.trancheCount);
  if (trancheAmount <= 0n) return undefined;
  try {
    const price = await context.priceChecker.source.getPrice(
      job.params.tokenIn,
      job.params.tokenOut,
    );
    return estimateUsdValue(trancheAmount, price);
  } catch {
    return undefined;
  }
}
