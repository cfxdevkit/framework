/**
 * Extract a readable message from any thrown value.
 *
 * Browser wallet providers frequently throw plain objects instead of `Error`
 * instances. This helper preserves the human-readable message instead of
 * degrading to `[object Object]`.
 */
export function errMsg(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const candidate = error as Record<string, unknown>;
    if (typeof candidate.message === 'string') return candidate.message;
    try {
      return JSON.stringify(error);
    } catch {
      return '[non-serializable error]';
    }
  }
  return String(error);
}
