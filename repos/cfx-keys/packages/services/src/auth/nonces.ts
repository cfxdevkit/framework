import { randomBytes } from 'node:crypto';

export interface NonceEntry {
  nonce: string;
  address: string;
  expiresAt: number;
  used: boolean;
}

export interface MemoryNonceStoreOptions {
  ttlMs?: number;
  nonceFactory?: () => string;
  now?: () => number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000;

function defaultNonceFactory(): string {
  return randomBytes(16).toString('hex');
}

export class MemoryNonceStore {
  readonly #ttlMs: number;
  readonly #nonceFactory: () => string;
  readonly #now: () => number;
  readonly #store = new Map<string, NonceEntry>();

  constructor(options: MemoryNonceStoreOptions = {}) {
    this.#ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.#nonceFactory = options.nonceFactory ?? defaultNonceFactory;
    this.#now = options.now ?? Date.now;
  }

  issue(address: string): string {
    const now = this.#now();
    this.sweepExpired(now);

    const nonce = this.#nonceFactory();
    this.#store.set(nonce, {
      nonce,
      address: address.toLowerCase(),
      expiresAt: now + this.#ttlMs,
      used: false,
    });
    return nonce;
  }

  peek(nonce: string): NonceEntry | null {
    return this.#store.get(nonce) ?? null;
  }

  consume(nonce: string, address: string): boolean {
    const entry = this.#store.get(nonce);
    if (!entry) return false;
    if (entry.used) return false;
    if (entry.expiresAt < this.#now()) {
      this.#store.delete(nonce);
      return false;
    }
    if (entry.address !== address.toLowerCase()) return false;
    entry.used = true;
    return true;
  }

  sweepExpired(now = this.#now()): void {
    for (const [nonce, entry] of this.#store) {
      if (entry.expiresAt < now) this.#store.delete(nonce);
    }
  }

  clear(): void {
    this.#store.clear();
  }
}

export function createMemoryNonceStore(options?: MemoryNonceStoreOptions): MemoryNonceStore {
  return new MemoryNonceStore(options);
}
