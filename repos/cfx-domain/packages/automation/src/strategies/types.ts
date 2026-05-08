import type { PriceChecker } from '../conditions/price.js';
import type { SafetyGuard } from '../safety.js';
import type { EvalResult, ExecutableJob } from '../types.js';

export interface StrategyEvalContext {
  nowSec: number;
  priceChecker: PriceChecker;
  safetyGuard: SafetyGuard;
}

export interface StrategyEvaluator<TJob extends ExecutableJob = ExecutableJob> {
  evaluate(job: TJob, context: StrategyEvalContext): Promise<EvalResult>;
}
