import { describe, expect, it } from 'vitest';
import {
  CfxError,
  isCfxError,
  RpcError,
  ContractError,
  WalletError,
  KeystoreError,
} from '@cfxdevkit/cdk/errors';

describe('errors', () => {
  it('CfxError carries code and meta', () => {
    const err = new CfxError({
      code: 'example/test',
      message: 'test error',
      meta: { foo: 42 },
    });
    expect(err.name).toBe('CfxError');
    expect(err.code).toBe('example/test');
    expect(err.message).toBe('test error');
    expect(err.meta).toEqual({ foo: 42 });
  });

  it('CfxError carries cause', () => {
    const cause = new Error('root');
    const err = new CfxError({
      code: 'example/cause',
      message: 'wrapped',
      cause,
    });
    expect(err.cause).toBe(cause);
  });

  it('toJSON serialises error safely', () => {
    const err = new CfxError({
      code: 'example/json',
      message: 'serialisable',
      meta: { a: 1 },
    });
    const json = err.toJSON();
    expect(json).toEqual({
      name: 'CfxError',
      code: 'example/json',
      message: 'serialisable',
      meta: { a: 1 },
    });
  });

  it('subclasses set correct name', () => {
    expect(new RpcError({ code: 'rpc/x', message: '' }).name).toBe('RpcError');
    expect(new ContractError({ code: 'contract/x', message: '' }).name).toBe('ContractError');
    expect(new WalletError({ code: 'wallet/x', message: '' }).name).toBe('WalletError');
    expect(new KeystoreError({ code: 'keystore/x', message: '' }).name).toBe('KeystoreError');
  });

  it('isCfxError guards CfxError and subclasses', () => {
    expect(isCfxError(new CfxError({ code: 'x', message: '' }))).toBe(true);
    expect(isCfxError(new RpcError({ code: 'x', message: '' }))).toBe(true);
    expect(isCfxError(new Error())).toBe(false);
    expect(isCfxError(null)).toBe(false);
    expect(isCfxError('error')).toBe(false);
  });
});
