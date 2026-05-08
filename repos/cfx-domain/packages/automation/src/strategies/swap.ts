import { estimateUsdValue } from '../conditions/price.js';
import type { EvalResult, SwapJob } from '../types.js';
import type { StrategyEvalContext, StrategyEvaluator } from './types.js';

export class SwapEvaluator implements StrategyEvaluator<SwapJob> {
  async evaluate(job: SwapJob, context: StrategyEvalContext): Promise<EvalResult> {
    const estimatedSwapUsd = await estimateSwapUsd(job, context);
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

async function estimateSwapUsd(
  job: SwapJob,
  context: StrategyEvalContext,
): Promise<number | undefined> {
  try {
    const price = await context.priceChecker.source.getPrice(
      job.params.tokenIn,
      job.params.tokenOut,
    );
    return estimateUsdValue(job.params.amountIn, price);
  } catch {
    return undefined;
  }
}
