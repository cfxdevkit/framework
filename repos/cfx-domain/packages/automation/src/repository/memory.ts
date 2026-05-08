import { randomUUID } from 'node:crypto';
import type {
  ExecutionRecord,
  ExecutionRepository,
  JobListFilter,
  JobRepository,
  JobUpdate,
  NewExecutionRecord,
  NewJobInput,
} from '../repository.js';
import type { ExecuteResult, Job, JobStatus, JobType } from '../types.js';

export class MemoryJobRepository implements JobRepository {
  readonly #jobs = new Map<string, Job>();

  async create(input: NewJobInput): Promise<Job> {
    const now = Date.now();
    const job = cloneJob({
      ...input,
      id: input.id ?? randomUUID(),
      status: input.status ?? 'pending',
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
      retries: input.retries ?? 0,
    } as Job);
    this.#jobs.set(job.id, job);
    return cloneJob(job);
  }

  async get(id: string): Promise<Job | undefined> {
    return cloneOptionalJob(this.#jobs.get(id));
  }

  async list(filter: JobListFilter = {}): Promise<Job[]> {
    return Array.from(this.#jobs.values())
      .filter((job) => matchesFilter(job, filter))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(cloneJob);
  }

  async update(id: string, update: JobUpdate): Promise<Job | undefined> {
    const existing = this.#jobs.get(id);
    if (!existing) return undefined;
    const updated = cloneJob({
      ...existing,
      ...update,
      updatedAt: update.updatedAt ?? Date.now(),
    } as Job);
    this.#jobs.set(id, updated);
    return cloneJob(updated);
  }

  async markActive(id: string, onChainJobId?: Job['onChainJobId']): Promise<Job | undefined> {
    return this.update(
      id,
      onChainJobId ? { status: 'active', onChainJobId } : { status: 'active' },
    );
  }

  async markExecuted(id: string, result: ExecuteResult): Promise<Job | undefined> {
    return this.update(
      id,
      result.txHash ? { status: 'executed', txHash: result.txHash } : { status: 'executed' },
    );
  }

  async markFailed(id: string, error: string): Promise<Job | undefined> {
    return this.update(id, { status: 'failed', lastError: error });
  }

  async incrementRetry(id: string, error?: string): Promise<Job | undefined> {
    const existing = this.#jobs.get(id);
    if (!existing) return undefined;
    return this.update(
      id,
      error
        ? { retries: existing.retries + 1, lastError: error }
        : { retries: existing.retries + 1 },
    );
  }

  async cancel(id: string, owner?: string): Promise<Job | undefined | 'forbidden'> {
    const existing = this.#jobs.get(id);
    if (!existing) return undefined;
    if (owner && existing.owner.toLowerCase() !== owner.toLowerCase()) return 'forbidden';
    if (!['pending', 'active', 'failed', 'paused'].includes(existing.status)) return undefined;
    return this.update(id, { status: 'cancelled' });
  }

  async getUpdatedSince(timestampMs: number): Promise<Job[]> {
    return Array.from(this.#jobs.values())
      .filter((job) => job.updatedAt >= timestampMs)
      .sort((left, right) => left.updatedAt - right.updatedAt)
      .map(cloneJob);
  }
}

export class MemoryExecutionRepository implements ExecutionRepository {
  readonly #records: ExecutionRecord[] = [];
  #nextId = 1;

  async create(input: NewExecutionRecord): Promise<ExecutionRecord> {
    const record: ExecutionRecord = {
      id: this.#nextId,
      jobId: input.jobId,
      txHash: input.txHash,
      timestamp: input.timestamp ?? Date.now(),
      ...(input.amountOut !== undefined ? { amountOut: input.amountOut } : {}),
    };
    this.#nextId += 1;
    this.#records.push(record);
    return cloneRecord(record);
  }

  async listByJob(jobId: string): Promise<ExecutionRecord[]> {
    return this.#records
      .filter((record) => record.jobId === jobId)
      .sort((left, right) => left.timestamp - right.timestamp)
      .map(cloneRecord);
  }
}

function matchesFilter(job: Job, filter: JobListFilter): boolean {
  return (
    matchesOwner(job, filter.owner) &&
    matchesOne(job.status, filter.status) &&
    matchesOne(job.type, filter.type)
  );
}

function matchesOwner(job: Job, owner?: string): boolean {
  return owner === undefined || job.owner.toLowerCase() === owner.toLowerCase();
}

function matchesOne<T extends JobStatus | JobType>(value: T, filter?: T | readonly T[]): boolean {
  if (filter === undefined) return true;
  return Array.isArray(filter) ? filter.includes(value) : value === filter;
}

function cloneOptionalJob(job: Job | undefined): Job | undefined {
  return job ? cloneJob(job) : undefined;
}

function cloneJob<T extends Job>(job: T): T {
  return { ...job, params: { ...job.params } } as T;
}

function cloneRecord(record: ExecutionRecord): ExecutionRecord {
  return { ...record };
}
