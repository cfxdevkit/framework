import { describe, expect, it } from 'vitest';
import { CfxError, ContractError, isCfxError, RpcError, WalletError } from './index.js';

describe('errors', () => {
  it('CfxError carries code, message, cause, meta', () => {
    const cause = new Error('boom');
    const e = new CfxError({
      code: 'core/test/x',
      message: 'something failed',
      cause,
      meta: { a: 1 },
    });
    expect(e.code).toBe('core/test/x');
    expect(e.message).toBe('something failed');
    expect(e.cause).toBe(cause);
    expect(e.meta).toEqual({ a: 1 });
    expect(e.name).toBe('CfxError');
  });

  it('toJSON produces a safe payload', () => {
    const e = new CfxError({ code: 'core/x', message: 'oops', meta: { k: 'v' } });
    const json = e.toJSON();
    expect(json).toEqual({ name: 'CfxError', code: 'core/x', message: 'oops', meta: { k: 'v' } });
    // round-trips through JSON.stringify
    expect(JSON.parse(JSON.stringify(json))).toEqual(json);
  });

  it('toJSON omits meta when absent', () => {
    const e = new CfxError({ code: 'core/x', message: 'oops' });
    expect(e.toJSON()).toEqual({ name: 'CfxError', code: 'core/x', message: 'oops' });
  });

  it('subclasses use their own name', () => {
    expect(new RpcError({ code: 'r', message: 'm' }).name).toBe('RpcError');
    expect(new ContractError({ code: 'c', message: 'm' }).name).toBe('ContractError');
    expect(new WalletError({ code: 'w', message: 'm' }).name).toBe('WalletError');
  });

  it('isCfxError discriminates', () => {
    expect(isCfxError(new CfxError({ code: 'a', message: 'b' }))).toBe(true);
    expect(isCfxError(new RpcError({ code: 'a', message: 'b' }))).toBe(true);
    expect(isCfxError(new Error('plain'))).toBe(false);
    expect(isCfxError(null)).toBe(false);
    expect(isCfxError('string')).toBe(false);
  });
});
