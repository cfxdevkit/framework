/** Shared in-memory nonce store with 5-minute TTL. */
export const nonces = new Map<string, { nonce: string; expiresAt: number }>();

export function pruneExpired() {
  const now = Date.now();
  for (const [addr, entry] of nonces) {
    if (entry.expiresAt < now) nonces.delete(addr);
  }
}
