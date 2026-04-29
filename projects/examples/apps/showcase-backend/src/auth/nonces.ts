/**
 * In-memory SIWE nonce store. Single-process only — fine for the showcase
 * demo, NOT for anything that fans out across replicas.
 */
import { randomBytes } from 'node:crypto';

export interface NonceEntry {
  nonce: string;
  address: string;
  expiresAt: number;
  used: boolean;
}

const TTL_MS = 5 * 60 * 1000;
const store = new Map<string, NonceEntry>();

export function issueNonce(address: string): string {
  // Periodic cheap GC.
  const now = Date.now();
  for (const [k, v] of store) if (v.expiresAt < now) store.delete(k);

  const nonce = randomBytes(16).toString('hex');
  store.set(nonce, {
    nonce,
    address: address.toLowerCase(),
    expiresAt: now + TTL_MS,
    used: false,
  });
  return nonce;
}

/**
 * Consume a nonce: returns true exactly once if the nonce is fresh and bound
 * to `address`. Subsequent calls for the same nonce fail (one-time use).
 */
export function consumeNonce(nonce: string, address: string): boolean {
  const entry = store.get(nonce);
  if (!entry) return false;
  if (entry.used) return false;
  if (entry.expiresAt < Date.now()) {
    store.delete(nonce);
    return false;
  }
  if (entry.address !== address.toLowerCase()) return false;
  entry.used = true;
  return true;
}

/** Test-only — wipe the store between cases. */
export function _resetNonces(): void {
  store.clear();
}
