/**
 * Extract a readable message from any thrown value.
 *
 * Wallet errors (Fluent, MetaMask, injected) are frequently plain objects
 * of the form `{ code: number, message: string }` — NOT Error instances —
 * so `e instanceof Error ? e.message : String(e)` produces "[object Object]".
 * This helper handles both cases.
 */
export function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e !== null) {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    try {
      return JSON.stringify(e);
    } catch {
      return '[non-serializable error]';
    }
  }
  return String(e);
}
