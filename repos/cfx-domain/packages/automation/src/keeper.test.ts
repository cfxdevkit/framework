import { describe, expect, it } from 'vitest';
import { PRICE_SCALE, PriceChecker, type PriceSource } from './conditions/price.js';
import type { KeeperClient } from './keeper/index.js';
import { Keeper } from './keeper.js';
import { MemoryExecutionRepository, MemoryJobRepository } from './repository/memory.js';
import { RetryQueue } from './retryQueue.js';
import { SafetyGuard } from './safety.js';
import { dcaJob, limitOrderJob, swapJob, twapJob } from './testHelpers.js';
import type { Job } from './types.js';

class FixedPriceSource implements PriceSource {
  constructor(readonly price = 3n * PRICE_SCALE) {}

  async getPrice(): Promise<bigint> {
    return this.price;
  }
}

class MockKeeperClient implements KeeperClient {
  limitOrderExecutions = 0;
  dcaExecutions = 0;
  twapExecutions = 0;
  swapExecutions = 0;
  fail = false;

  async executeLimitOrder() {
    this.limitOrderExecutions += 1;
    if (this.fail) throw new Error('temporary failure');
    return { txHash: '0xlimit', amountOut: 200n } as const;
  }

  async executeDCATick() {
    this.dcaExecutions += 1;
    if (this.fail) throw new Error('temporary failure');
    return { txHash: '0xdca', amountOut: 20n, nextExecutionSec: 5_000 } as const;
  }

  async executeTWAPTick() {
    this.twapExecutions += 1;
    if (this.fail) throw new Error('temporary failure');
    return { txHash: '0xtwap', amountOut: 20n, nextExecutionSec: 8_000 } as const;
  }

  async executeSwap() {
    this.swapExecutions += 1;
    if (this.fail) throw new Error('temporary failure');
    return { txHash: '0xswap', amountOut: 20n } as const;
  }

  async getOnChainStatus() {
    return 'active' as const;
  }
}

describe('Keeper', () => {
  it('executes eligible limit orders and records executions', async () => {
    const jobs = new MemoryJobRepository();
    const executions = new MemoryExecutionRepository();
    const client = new MockKeeperClient();
    await jobs.create(limitOrderJob({ id: 'limit' }));

    const keeper = new Keeper({
      repository: jobs,
      executionRepository: executions,
      priceChecker: new PriceChecker(new FixedPriceSource()),
      safetyGuard: new SafetyGuard(),
      keeperClient: client,
    });

    const results = await keeper.runAllTicks();
    expect(results).toMatchObject([{ jobId: 'limit', skipped: false }]);
    expect((await jobs.get('limit'))?.status).toBe('executed');
    expect(await executions.listByJob('limit')).toHaveLength(1);
    expect(client.limitOrderExecutions).toBe(1);
  });

  it('advances DCA jobs until completion', async () => {
    const jobs = new MemoryJobRepository();
    const client = new MockKeeperClient();
    await jobs.create(dcaJob({ id: 'dca', params: { ...dcaJob().params, totalSwaps: 2 } }));

    const keeper = new Keeper({
      repository: jobs,
      priceChecker: new PriceChecker(new FixedPriceSource()),
      safetyGuard: new SafetyGuard(),
      keeperClient: client,
    });

    await keeper.processTick(await getRequiredJob(jobs, 'dca'));
    const updated = await jobs.get('dca');
    expect(updated?.status).toBe('active');
    expect(updated?.type === 'dca' ? updated.params.swapsCompleted : 0).toBe(1);
    expect(updated?.type === 'dca' ? updated.params.nextExecution : 0).toBe(5_000);
  });

  it('advances TWAP jobs until completion', async () => {
    const jobs = new MemoryJobRepository();
    const client = new MockKeeperClient();
    await jobs.create(twapJob({ id: 'twap', params: { ...twapJob().params, trancheCount: 2 } }));

    const keeper = new Keeper({
      repository: jobs,
      priceChecker: new PriceChecker(new FixedPriceSource()),
      safetyGuard: new SafetyGuard(),
      keeperClient: client,
    });

    await keeper.processTick(await getRequiredJob(jobs, 'twap'));
    const updated = await jobs.get('twap');
    expect(updated?.status).toBe('active');
    expect(updated?.type === 'twap' ? updated.params.tranchesCompleted : 0).toBe(1);
    expect(updated?.type === 'twap' ? updated.params.nextExecution : 0).toBe(8_000);
    expect(client.twapExecutions).toBe(1);
  });

  it('executes one-shot swap jobs', async () => {
    const jobs = new MemoryJobRepository();
    const client = new MockKeeperClient();
    await jobs.create(swapJob({ id: 'swap' }));

    const keeper = new Keeper({
      repository: jobs,
      priceChecker: new PriceChecker(new FixedPriceSource()),
      safetyGuard: new SafetyGuard(),
      keeperClient: client,
    });

    const result = await keeper.processTick(await getRequiredJob(jobs, 'swap'));
    expect(result).toMatchObject({ jobId: 'swap', skipped: false });
    expect((await jobs.get('swap'))?.status).toBe('executed');
    expect(client.swapExecutions).toBe(1);
  });

  it('increments retries before marking failures terminal', async () => {
    const jobs = new MemoryJobRepository();
    const client = new MockKeeperClient();
    client.fail = true;
    await jobs.create(limitOrderJob({ id: 'limit', maxRetries: 2 }));

    const keeper = new Keeper({
      repository: jobs,
      priceChecker: new PriceChecker(new FixedPriceSource()),
      safetyGuard: new SafetyGuard(),
      keeperClient: client,
    });

    await keeper.processTick(await getRequiredJob(jobs, 'limit'));
    expect((await jobs.get('limit'))?.retries).toBe(1);
    await keeper.processTick(await getRequiredJob(jobs, 'limit'));
    expect((await jobs.get('limit'))?.status).toBe('failed');
  });

  it('adds failed jobs to the retry queue', async () => {
    const jobs = new MemoryJobRepository();
    const client = new MockKeeperClient();
    const retryQueue = new RetryQueue({ baseDelayMs: 1, jitter: 0, random: () => 0 });
    client.fail = true;
    await jobs.create(limitOrderJob({ id: 'limit', maxRetries: 3 }));

    const keeper = new Keeper({
      repository: jobs,
      retryQueue,
      priceChecker: new PriceChecker(new FixedPriceSource()),
      safetyGuard: new SafetyGuard(),
      keeperClient: client,
    });

    await keeper.processTick(await getRequiredJob(jobs, 'limit'));
    expect(retryQueue.size()).toBe(1);
  });

  it('updates heartbeat after batch ticks', async () => {
    const jobs = new MemoryJobRepository();
    const heartbeats: number[] = [];
    const keeper = new Keeper({
      repository: jobs,
      priceChecker: new PriceChecker(new FixedPriceSource()),
      safetyGuard: new SafetyGuard(),
      keeperClient: new MockKeeperClient(),
      onHeartbeat: (timestamp) => heartbeats.push(timestamp),
    });

    expect(await keeper.runAllTicks()).toEqual([]);
    expect(heartbeats).toHaveLength(1);
  });
});

async function getRequiredJob(repository: MemoryJobRepository, id: string): Promise<Job> {
  const job = await repository.get(id);
  if (!job) throw new Error(`missing test job ${id}`);
  return job;
}
