export type OperationStatus = 'running' | 'succeeded' | 'failed';

export interface OperationStep {
  ts: number;
  message: string;
  detail?: unknown;
}

export interface OperationRecord {
  id: string;
  tool: string;
  startedAt: number;
  finishedAt?: number;
  durationMs?: number;
  status: OperationStatus;
  argsPreview?: unknown;
  error?: string;
  steps: OperationStep[];
}

export interface OperationLedgerOptions {
  clock?: () => number;
  idFactory?: () => string;
  limit?: number;
}

export class OperationLedger {
  readonly #clock: () => number;
  readonly #idFactory: () => string;
  readonly #limit: number;
  readonly #records = new Map<string, OperationRecord>();

  constructor(options: OperationLedgerOptions = {}) {
    this.#clock = options.clock ?? Date.now;
    this.#idFactory = options.idFactory ?? randomId;
    this.#limit = options.limit ?? 100;
  }

  startOperation(tool: string, argsPreview?: unknown): OperationRecord {
    const startedAt = this.#clock();
    const record: OperationRecord = {
      id: this.#idFactory(),
      tool,
      startedAt,
      status: 'running',
      argsPreview,
      steps: [],
    };
    this.#records.set(record.id, record);
    this.#trim();
    return cloneRecord(record);
  }

  addOperationStep(id: string, message: string, detail?: unknown): OperationRecord | undefined {
    const record = this.#records.get(id);
    if (!record) return undefined;
    record.steps.push({ ts: this.#clock(), message, detail });
    return cloneRecord(record);
  }

  finishOperation(
    id: string,
    status: Exclude<OperationStatus, 'running'>,
    error?: string,
  ): OperationRecord | undefined {
    const record = this.#records.get(id);
    if (!record) return undefined;
    const finishedAt = this.#clock();
    record.status = status;
    record.finishedAt = finishedAt;
    record.durationMs = finishedAt - record.startedAt;
    if (error) record.error = error;
    return cloneRecord(record);
  }

  getOperation(id: string): OperationRecord | undefined {
    const record = this.#records.get(id);
    return record ? cloneRecord(record) : undefined;
  }

  listOperations(limit = this.#limit): OperationRecord[] {
    return [...this.#records.values()]
      .sort((left, right) => right.startedAt - left.startedAt)
      .slice(0, limit)
      .map(cloneRecord);
  }

  #trim(): void {
    const excess = this.#records.size - this.#limit;
    if (excess <= 0) return;
    const oldest = [...this.#records.values()]
      .sort((left, right) => left.startedAt - right.startedAt)
      .slice(0, excess);
    for (const record of oldest) this.#records.delete(record.id);
  }
}

function cloneRecord(record: OperationRecord): OperationRecord {
  return { ...record, steps: record.steps.map((step) => ({ ...step })) };
}

function randomId(): string {
  return `op_${Math.random().toString(36).slice(2, 10)}`;
}
