export interface ContractRecord {
  id: string;
  name: string;
  address: string;
  abi: unknown[];
  space: 'core' | 'espace';
  deployedAt: number;
}

export class ContractRegistry {
  readonly #records = new Map<string, ContractRecord>();

  list(): ContractRecord[] {
    return [...this.#records.values()];
  }

  get(id: string): ContractRecord | undefined {
    return this.#records.get(id);
  }

  register(input: Omit<ContractRecord, 'id' | 'deployedAt'>): ContractRecord {
    const id = crypto.randomUUID();
    const record: ContractRecord = { ...input, id, deployedAt: Date.now() };
    this.#records.set(id, record);
    return record;
  }

  delete(id: string): boolean {
    return this.#records.delete(id);
  }

  clear(): number {
    const count = this.#records.size;
    this.#records.clear();
    return count;
  }
}

/** Detect which Conflux space an address belongs to based on its prefix. */
export function detectSpace(address: string): 'core' | 'espace' {
  return address.startsWith('cfx') || address.startsWith('net') ? 'core' : 'espace';
}
