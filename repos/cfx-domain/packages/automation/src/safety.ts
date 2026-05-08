import { isDCADue, isExpired } from './conditions/time.js';
import type { Job } from './types.js';

export interface SafetyConfig {
  maxSwapUsd: number;
  maxSlippageBps: number;
  maxRetries: number;
  minExecutionIntervalSeconds: number;
  globalPause: boolean;
}

export const DEFAULT_SAFETY_CONFIG: SafetyConfig = {
  maxSwapUsd: 10_000,
  maxSlippageBps: 500,
  maxRetries: 5,
  minExecutionIntervalSeconds: 30,
  globalPause: false,
};

export interface SafetyContext {
  nowSec: number;
  estimatedSwapUsd?: number;
}

export interface SafetyViolation {
  rule: string;
  message: string;
  jobId: string;
  ts: number;
}

export interface SafetyCheckResult {
  ok: boolean;
  violations: SafetyViolation[];
}

export class SafetyGuard {
  #config: SafetyConfig;
  readonly #violations: SafetyViolation[] = [];

  constructor(config: Partial<SafetyConfig> = {}) {
    this.#config = { ...DEFAULT_SAFETY_CONFIG, ...config };
  }

  get config(): SafetyConfig {
    return { ...this.#config };
  }

  updateConfig(config: Partial<SafetyConfig>): SafetyConfig {
    this.#config = { ...this.#config, ...config };
    return this.config;
  }

  pauseAll(): SafetyConfig {
    return this.updateConfig({ globalPause: true });
  }

  resumeAll(): SafetyConfig {
    return this.updateConfig({ globalPause: false });
  }

  check(job: Job, context: SafetyContext): SafetyCheckResult {
    const violations: SafetyViolation[] = [];
    const addViolation = (rule: string, message: string) => {
      violations.push({ rule, message, jobId: job.id, ts: context.nowSec });
    };

    if (this.#config.globalPause) addViolation('global_pause', 'automation is globally paused');
    if (job.status !== 'active') addViolation('status', `job status is ${job.status}`);
    if (job.retries >= Math.min(job.maxRetries, this.#config.maxRetries)) {
      addViolation('max_retries', 'job retry limit reached');
    }
    if (isExpired(job, context.nowSec)) addViolation('expiry', 'job has expired');

    const slippageBps = 'slippageBps' in job.params ? job.params.slippageBps : undefined;
    if (slippageBps !== undefined && slippageBps > this.#config.maxSlippageBps) {
      addViolation('slippage', 'job slippage exceeds configured maximum');
    }

    if (
      context.estimatedSwapUsd !== undefined &&
      context.estimatedSwapUsd > this.#config.maxSwapUsd
    ) {
      addViolation('swap_size', 'estimated swap size exceeds configured maximum');
    }

    if (
      job.type === 'dca' &&
      job.params.intervalSeconds < this.#config.minExecutionIntervalSeconds
    ) {
      addViolation('min_interval', 'DCA interval is below configured minimum');
    }

    if (job.type === 'dca' && !isDCADue(job.params, context.nowSec)) {
      addViolation('dca_interval', 'DCA interval has not elapsed');
    }

    this.#violations.push(...violations);
    return { ok: violations.length === 0, violations };
  }

  getViolations(): SafetyViolation[] {
    return this.#violations.map((violation) => ({ ...violation }));
  }

  clearViolations(): void {
    this.#violations.splice(0, this.#violations.length);
  }
}
