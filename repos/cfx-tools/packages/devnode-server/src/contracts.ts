import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export type ContractNetwork = 'local' | 'testnet' | 'mainnet';

export interface ContractRecord {
  id: string;
  name: string;
  address: string;
  abi: unknown[];
  network: ContractNetwork;
  chainId: number;
  space: 'core' | 'espace';
  deployedAt: number;
  constructorArgs?: unknown[];
  deployer?: string;
  metadata?: Record<string, unknown>;
  txHash?: string;
}

export interface ContractListFilter {
  network?: ContractNetwork;
  chainId?: number;
  space?: 'core' | 'espace';
}

export interface ContractRegistryOptions {
  storagePath?: string;
}

interface ContractRegistryStore {
  wallets?: Record<string, ContractRecord[]>;
}

export class ContractRegistry {
  readonly #records = new Map<string, ContractRecord>();
  readonly #storagePath: string | undefined;
  #activeWalletId: string | null = null;

  constructor(options: ContractRegistryOptions = {}) {
    this.#storagePath = options.storagePath;
  }

  async syncWallet(walletId: string | null): Promise<void> {
    if (walletId === this.#activeWalletId) return;

    this.#activeWalletId = walletId;
    this.#records.clear();
    if (!walletId) return;

    const store = await this.#readStore();
    const records = store.wallets?.[walletId] ?? [];
    for (const record of records) {
      this.#records.set(record.id, record);
    }
  }

  list(filter: ContractListFilter = {}): ContractRecord[] {
    return [...this.#records.values()].filter((record) => {
      if (filter.network !== undefined && record.network !== filter.network) return false;
      if (filter.chainId !== undefined && record.chainId !== filter.chainId) return false;
      if (filter.space !== undefined && record.space !== filter.space) return false;
      return true;
    });
  }

  get(id: string): ContractRecord | undefined {
    return this.#records.get(id);
  }

  async register(
    input: Omit<ContractRecord, 'id' | 'deployedAt'> &
      Partial<Pick<ContractRecord, 'id' | 'deployedAt'>>,
  ): Promise<ContractRecord> {
    const id = input.id ?? crypto.randomUUID();
    const record: ContractRecord = { ...input, id, deployedAt: input.deployedAt ?? Date.now() };
    this.#records.set(id, record);
    await this.#persistCurrent();
    return record;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.#records.delete(id);
    if (deleted) await this.#persistCurrent();
    return deleted;
  }

  async clear(): Promise<number> {
    const count = this.#records.size;
    this.#records.clear();
    await this.#persistCurrent();
    return count;
  }

  async #persistCurrent(): Promise<void> {
    if (!this.#storagePath || !this.#activeWalletId) return;

    const store = await this.#readStore();
    const wallets = store.wallets ?? {};
    wallets[this.#activeWalletId] = [...this.#records.values()];
    await this.#writeStore({ wallets });
  }

  async #readStore(): Promise<ContractRegistryStore> {
    if (!this.#storagePath) return {};

    try {
      const raw = await readFile(this.#storagePath, 'utf8');
      const parsed = JSON.parse(raw) as ContractRegistryStore | unknown[];
      if (Array.isArray(parsed)) {
        return {
          wallets:
            this.#activeWalletId == null
              ? {}
              : {
                  [this.#activeWalletId]: parsed
                    .map((entry) => normalizeContractRecord(entry))
                    .filter((entry): entry is ContractRecord => entry !== null),
                },
        };
      }

      if (!parsed || typeof parsed !== 'object') return {};
      const wallets = Object.fromEntries(
        Object.entries(parsed.wallets ?? {}).map(([walletId, records]) => [
          walletId,
          Array.isArray(records)
            ? records
                .map((entry) => normalizeContractRecord(entry))
                .filter((entry): entry is ContractRecord => entry !== null)
            : [],
        ]),
      );
      return { wallets };
    } catch {
      return {};
    }
  }

  async #writeStore(store: ContractRegistryStore): Promise<void> {
    if (!this.#storagePath) return;
    await mkdir(dirname(this.#storagePath), { recursive: true });
    await writeFile(this.#storagePath, JSON.stringify(store, null, 2), 'utf8');
  }
}

/** Detect which Conflux space an address belongs to based on its prefix. */
export function detectSpace(address: string): 'core' | 'espace' {
  return address.startsWith('cfx') || address.startsWith('net') ? 'core' : 'espace';
}

export function chainIdForContractNetwork(
  network: ContractNetwork,
  space: 'core' | 'espace',
): number {
  if (network === 'local') {
    return space === 'core' ? 2029 : 2030;
  }
  if (network === 'testnet') {
    return space === 'core' ? 1 : 71;
  }
  return space === 'core' ? 1029 : 1030;
}

function normalizeContractRecord(value: unknown): ContractRecord | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Partial<ContractRecord>;
  if (
    typeof record.id !== 'string' ||
    typeof record.name !== 'string' ||
    typeof record.address !== 'string' ||
    !Array.isArray(record.abi) ||
    (record.network !== 'local' && record.network !== 'testnet' && record.network !== 'mainnet') ||
    !Number.isInteger(record.chainId) ||
    (record.space !== 'core' && record.space !== 'espace') ||
    !Number.isInteger(record.deployedAt)
  ) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    address: record.address,
    abi: record.abi,
    network: record.network,
    chainId: record.chainId as number,
    space: record.space,
    deployedAt: record.deployedAt as number,
    ...(Array.isArray(record.constructorArgs) ? { constructorArgs: record.constructorArgs } : {}),
    ...(typeof record.deployer === 'string' ? { deployer: record.deployer } : {}),
    ...(record.metadata && typeof record.metadata === 'object'
      ? { metadata: record.metadata }
      : {}),
    ...(typeof record.txHash === 'string' ? { txHash: record.txHash } : {}),
  };
}
