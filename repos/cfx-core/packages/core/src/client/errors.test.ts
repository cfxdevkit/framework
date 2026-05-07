import { describe, expect, it } from 'vitest';
import { CfxError, RpcError } from '../errors/index.js';
import { nullWhenNotFound, wrapRpc } from './errors.js';

describe('wrapRpc', () => {
  it('resolves with the value when the promise succeeds', async () => {
    const result = await wrapRpc(Promise.resolve(42), 'test/code');
    expect(result).toBe(42);
  });

  it('re-throws CfxError instances unchanged', async () => {
    const err = new CfxError({ code: 'test/already', message: 'already typed' });
    await expect(wrapRpc(Promise.reject(err), 'test/code')).rejects.toBe(err);
  });

  it('wraps a plain Error in RpcError', async () => {
    const cause = new Error('network timeout');
    const result = wrapRpc(Promise.reject(cause), 'core/client/timeout');
    await expect(result).rejects.toBeInstanceOf(RpcError);
    await expect(result).rejects.toMatchObject({ code: 'core/client/timeout' });
  });

  it('wraps a non-Error rejection (string) in RpcError with its string value as message', async () => {
    const result = wrapRpc(Promise.reject('string error'), 'core/client/unknown');
    await expect(result).rejects.toBeInstanceOf(RpcError);
    await expect(result).rejects.toMatchObject({ message: 'string error' });
  });

  it('forwards optional meta to the RpcError', async () => {
    const result = wrapRpc(Promise.reject(new Error('fail')), 'core/client/meta', { url: 'x' });
    await expect(result).rejects.toMatchObject({ meta: { url: 'x' } });
  });
});

describe('nullWhenNotFound', () => {
  it('resolves with the value when the promise succeeds', async () => {
    const result = await nullWhenNotFound(Promise.resolve('found'), 'TransactionNotFound');
    expect(result).toBe('found');
  });

  it('returns null when the error name matches the notFoundName', async () => {
    const notFound = Object.assign(new Error('tx not found'), { name: 'TransactionNotFound' });
    const result = await nullWhenNotFound(Promise.reject(notFound), 'TransactionNotFound');
    expect(result).toBeNull();
  });

  it('re-throws when the error name does not match', async () => {
    const err = Object.assign(new Error('other error'), { name: 'SomeOtherError' });
    await expect(nullWhenNotFound(Promise.reject(err), 'TransactionNotFound')).rejects.toBe(err);
  });

  it('re-throws when the rejection has no name property', async () => {
    await expect(
      nullWhenNotFound(Promise.reject('bare string'), 'TransactionNotFound'),
    ).rejects.toBe('bare string');
  });
});
