import { createPoller, type ExecutionTask, executeBatch, withLock } from '@cfxdevkit/executor';
import type { PriceChecker } from './conditions/price.js';
import { isExpired } from './conditions/time.js';
import type { KeeperClient } from './keeper/index.js';
import type { ExecutionRepository, JobRepository } from './repository.js';
import { RetryQueue } from './retryQueue.js';
import type { SafetyGuard } from './safety.js';
import { DCAEvaluator } from './strategies/dca.js';
import { LimitOrderEvaluator } from './strategies/limitOrder.js';
import { SwapEvaluator } from './strategies/swap.js';
import { TWAPEvaluator } from './strategies/twap.js';
import type { StrategyEvaluator } from './strategies/types.js';
import type {
  DCAJob,
  ExecutableJob,
  Job,
  LimitOrderJob,
  SwapJob,
  TickResult,
  TWAPJob,
} from './types.js';

export interface KeeperConfig {
  intervalMs?: number;
  concurrency?: number;
}

export interface KeeperDeps {
  repository: JobRepository;
  priceChecker: PriceChecker;
  safetyGuard: SafetyGuard;
  keeperClient: KeeperClient;
  executionRepository?: ExecutionRepository;
  retryQueue?: RetryQueue;
  onHeartbeat?: (timestampMs: number) => Promise<void> | void;
  evaluators?: Partial<{
    limit_order: StrategyEvaluator<LimitOrderJob>;
    dca: StrategyEvaluator<DCAJob>;
    twap: StrategyEvaluator<TWAPJob>;
    swap: StrategyEvaluator<SwapJob>;
  }>;
}

export class Keeper {
  readonly #repository: JobRepository;
  readonly #priceChecker: PriceChecker;
  readonly #safetyGuard: SafetyGuard;
  readonly #keeperClient: KeeperClient;
  readonly #executionRepository: ExecutionRepository | undefined;
  readonly #retryQueue: RetryQueue;
  readonly #onHeartbeat: ((timestampMs: number) => Promise<void> | void) | undefined;
  readonly #concurrency: number;
  readonly #evaluators: {
    limit_order: StrategyEvaluator<LimitOrderJob>;
    dca: StrategyEvaluator<DCAJob>;
    twap: StrategyEvaluator<TWAPJob>;
    swap: StrategyEvaluator<SwapJob>;
  };
  readonly #poller;

  constructor(deps: KeeperDeps, config: KeeperConfig = {}) {
    this.#repository = deps.repository;
    this.#priceChecker = deps.priceChecker;
    this.#safetyGuard = deps.safetyGuard;
    this.#keeperClient = deps.keeperClient;
    this.#executionRepository = deps.executionRepository;
    this.#retryQueue = deps.retryQueue ?? new RetryQueue();
    this.#onHeartbeat = deps.onHeartbeat;
    this.#concurrency = Math.max(1, config.concurrency ?? 1);
    this.#evaluators = {
      limit_order: deps.evaluators?.limit_order ?? new LimitOrderEvaluator(),
      dca: deps.evaluators?.dca ?? new DCAEvaluator(),
      twap: deps.evaluators?.twap ?? new TWAPEvaluator(),
      swap: deps.evaluators?.swap ?? new SwapEvaluator(),
    };
    this.#poller = createPoller(async () => {
      await this.runAllTicks();
    }, config.intervalMs ?? 15_000);
  }

  start(): void {
    this.#poller.start();
  }

  stop(): Promise<void> {
    return this.#poller.stop();
  }

  isRunning(): boolean {
    return this.#poller.isRunning();
  }

  async runAllTicks(): Promise<TickResult[]> {
    const activeJobs = await this.#repository.list({
      status: 'active',
      type: ['limit_order', 'dca', 'twap', 'swap'],
    });
    const jobs = mergeJobs(activeJobs, this.#retryQueue.drainDue());
    const tasks: Array<ExecutionTask<TickResult>> = jobs.map((job) => {
      return () => withLock(job.id, () => this.processTick(job));
    });
    const results = await executeBatch(tasks, { concurrency: this.#concurrency });
    await this.#onHeartbeat?.(Date.now());
    return results.map((result) => {
      if (result.ok) return result.value;
      return { jobId: 'unknown', skipped: true, reason: errorMessage(result.error) };
    });
  }

  async processTick(job: Job): Promise<TickResult> {
    const nowSec = Math.floor(Date.now() / 1_000);
    if (isExpired(job, nowSec)) {
      await this.#repository.update(job.id, { status: 'expired' });
      return skipped(job.id, 'expired');
    }

    const onChainStatus = await this.#getOnChainStatus(job);
    if (onChainStatus && onChainStatus !== 'active') {
      await this.#repository.update(job.id, { status: onChainStatus });
      return skipped(job.id, `onchain_${onChainStatus}`);
    }

    const evaluation = await this.#evaluate(job, nowSec);
    if (!evaluation.shouldExecute) return skipped(job.id, evaluation.reason ?? 'condition_not_met');

    try {
      const result = await this.#execute(job);
      await this.#recordExecution(job, result);
      return { jobId: job.id, skipped: false, result };
    } catch (error) {
      return this.#handleExecutionError(job, error);
    }
  }

  async #evaluate(job: ExecutableJob, nowSec: number) {
    const context = {
      nowSec,
      priceChecker: this.#priceChecker,
      safetyGuard: this.#safetyGuard,
    };
    if (job.type === 'limit_order') return this.#evaluators.limit_order.evaluate(job, context);
    if (job.type === 'dca') return this.#evaluators.dca.evaluate(job, context);
    if (job.type === 'twap') return this.#evaluators.twap.evaluate(job, context);
    return this.#evaluators.swap.evaluate(job, context);
  }

  async #execute(job: ExecutableJob) {
    if (job.type === 'limit_order') return this.#keeperClient.executeLimitOrder(job);
    if (job.type === 'dca') return this.#keeperClient.executeDCATick(job);
    if (job.type === 'twap') return this.#keeperClient.executeTWAPTick(job);
    return this.#keeperClient.executeSwap(job);
  }

  async #recordExecution(job: ExecutableJob, result: NonNullable<TickResult['result']>) {
    await this.#executionRepository?.create({
      jobId: job.id,
      txHash: result.txHash,
      ...(result.amountOut !== undefined ? { amountOut: result.amountOut } : {}),
    });

    if (job.type === 'dca') {
      const swapsCompleted = job.params.swapsCompleted + 1;
      const nextExecution =
        result.nextExecutionSec ?? job.params.nextExecution + job.params.intervalSeconds;
      await this.#repository.update(job.id, {
        status: swapsCompleted >= job.params.totalSwaps ? 'executed' : 'active',
        txHash: result.txHash,
        params: { ...job.params, swapsCompleted, nextExecution },
      });
      return;
    }

    if (job.type === 'twap') {
      const tranchesCompleted = job.params.tranchesCompleted + 1;
      const nextExecution =
        result.nextExecutionSec ?? job.params.nextExecution + job.params.trancheIntervalSeconds;
      await this.#repository.update(job.id, {
        status: tranchesCompleted >= job.params.trancheCount ? 'executed' : 'active',
        txHash: result.txHash,
        params: { ...job.params, tranchesCompleted, nextExecution },
      });
      return;
    }

    await this.#repository.markExecuted(job.id, result);
  }

  async #handleExecutionError(job: ExecutableJob, error: unknown): Promise<TickResult> {
    const message = errorMessage(error);
    if (job.retries + 1 >= Math.min(job.maxRetries, this.#safetyGuard.config.maxRetries)) {
      await this.#repository.markFailed(job.id, message);
      return skipped(job.id, 'max_retries_reached');
    }
    await this.#repository.incrementRetry(job.id, message);
    this.#retryQueue.enqueue({ ...job, retries: job.retries + 1 });
    return skipped(job.id, message);
  }

  async #getOnChainStatus(job: ExecutableJob) {
    if (!job.onChainJobId) return undefined;
    return this.#keeperClient.getOnChainStatus(job.onChainJobId);
  }
}

function skipped(jobId: string, reason: string): TickResult {
  return { jobId, skipped: true, reason };
}

function mergeJobs(activeJobs: Job[], retryJobs: Job[]): Job[] {
  const jobs = new Map<string, Job>();
  for (const job of activeJobs) jobs.set(job.id, job);
  for (const job of retryJobs) jobs.set(job.id, job);
  return Array.from(jobs.values());
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
