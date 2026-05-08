import type { DCAJob, EvalResult } from '../types.js';
import type { StrategyEvalContext, StrategyEvaluator } from './types.js';

export class DCAEvaluator implements StrategyEvaluator<DCAJob> {
  async evaluate(job: DCAJob, context: StrategyEvalContext): Promise<EvalResult> {
    const dcaCheck = await context.priceChecker.checkDCA(job, context.nowSec);
    if (!dcaCheck.conditionMet) {
      return {
        shouldExecute: false,
        reason: 'dca_interval_not_elapsed',
        ...optionalEstimatedSwapUsd(dcaCheck.estimatedSwapUsd),
      };
    }

    const safety = context.safetyGuard.check(job, {
      nowSec: context.nowSec,
      ...(dcaCheck.estimatedSwapUsd !== undefined
        ? { estimatedSwapUsd: dcaCheck.estimatedSwapUsd }
        : {}),
    });
    if (!safety.ok) {
      return {
        shouldExecute: false,
        reason: safety.violations.map((violation) => violation.rule).join(','),
        ...optionalEstimatedSwapUsd(dcaCheck.estimatedSwapUsd),
      };
    }

    return { shouldExecute: true, ...optionalEstimatedSwapUsd(dcaCheck.estimatedSwapUsd) };
  }
}

function optionalEstimatedSwapUsd(value: number | undefined): Pick<EvalResult, 'estimatedSwapUsd'> {
  return value === undefined ? {} : { estimatedSwapUsd: value };
}
