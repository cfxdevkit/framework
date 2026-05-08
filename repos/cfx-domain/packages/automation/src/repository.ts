import type { ExecuteResult, HexHash, Job, JobStatus, JobType } from './types.js';

export type NewJobInput = Omit<Job, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retries'> & {
  id?: string;
  status?: JobStatus;
  createdAt?: number;
  updatedAt?: number;
  retries?: number;
};

export interface JobListFilter {
  owner?: string;
  status?: JobStatus | readonly JobStatus[];
  type?: JobType | readonly JobType[];
}

export interface JobUpdate {
  status?: JobStatus;
  retries?: number;
  maxRetries?: number;
  onChainJobId?: HexHash;
  expiresAt?: number;
  lastError?: string;
  txHash?: HexHash;
  params?: Job['params'];
  updatedAt?: number;
}

export interface JobRepository {
  create(input: NewJobInput): Promise<Job>;
  get(id: string): Promise<Job | undefined>;
  list(filter?: JobListFilter): Promise<Job[]>;
  update(id: string, update: JobUpdate): Promise<Job | undefined>;
  markActive(id: string, onChainJobId?: HexHash): Promise<Job | undefined>;
  markExecuted(id: string, result: ExecuteResult): Promise<Job | undefined>;
  markFailed(id: string, error: string): Promise<Job | undefined>;
  incrementRetry(id: string, error?: string): Promise<Job | undefined>;
  cancel(id: string, owner?: string): Promise<Job | undefined | 'forbidden'>;
  getUpdatedSince(timestampMs: number): Promise<Job[]>;
}

export interface ExecutionRecord {
  id: number;
  jobId: string;
  txHash: HexHash;
  timestamp: number;
  amountOut?: bigint;
}

export interface NewExecutionRecord {
  jobId: string;
  txHash: HexHash;
  timestamp?: number;
  amountOut?: bigint;
}

export interface ExecutionRepository {
  create(input: NewExecutionRecord): Promise<ExecutionRecord>;
  listByJob(jobId: string): Promise<ExecutionRecord[]>;
}
