import type { EvalResult, LimitOrderJob } from '../types.js';
import type { StrategyEvalContext, StrategyEvaluator } from './types.js';

export class LimitOrderEvaluator implements StrategyEvaluator<LimitOrderJob> {
  async evaluate(job: LimitOrderJob, context: StrategyEvalContext): Promise<EvalResult> {
    const priceCheck = await context.priceChecker.checkLimitOrder(job);
    if (!priceCheck.conditionMet) {
      return {
        shouldExecute: false,
        reason: 'price_condition_not_met',
        currentPrice: priceCheck.currentPrice,
        ...optionalEstimatedSwapUsd(priceCheck.estimatedSwapUsd),
      };
    }

    const safety = context.safetyGuard.check(job, {
      nowSec: context.nowSec,
      ...(priceCheck.estimatedSwapUsd !== undefined
        ? { estimatedSwapUsd: priceCheck.estimatedSwapUsd }
        : {}),
    });
    if (!safety.ok) {
      return {
        shouldExecute: false,
        reason: safety.violations.map((violation) => violation.rule).join(','),
        currentPrice: priceCheck.currentPrice,
        ...optionalEstimatedSwapUsd(priceCheck.estimatedSwapUsd),
      };
    }

    return {
      shouldExecute: true,
      currentPrice: priceCheck.currentPrice,
      ...optionalEstimatedSwapUsd(priceCheck.estimatedSwapUsd),
    };
  }
}

function optionalEstimatedSwapUsd(value: number | undefined): Pick<EvalResult, 'estimatedSwapUsd'> {
  return value === undefined ? {} : { estimatedSwapUsd: value };
}
