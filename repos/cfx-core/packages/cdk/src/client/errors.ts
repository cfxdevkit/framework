import { CfxError, RpcError } from '../errors/index.js';

export function wrapRpc<T>(
  promise: Promise<T>,
  code: string,
  meta?: Record<string, unknown>,
): Promise<T> {
  return promise.catch((cause) => {
    if (cause instanceof CfxError) throw cause;
    throw new RpcError({
      code,
      message: cause instanceof Error ? cause.message : String(cause),
      cause,
      ...(meta ? { meta } : {}),
    });
  });
}

export function nullWhenNotFound<T>(promise: Promise<T>, notFoundName: string): Promise<T | null> {
  return promise.catch((err: unknown) => {
    if (err && typeof err === 'object' && 'name' in err) {
      const name = (err as { name?: string }).name;
      if (name === notFoundName) return null;
    }
    throw err;
  });
}
