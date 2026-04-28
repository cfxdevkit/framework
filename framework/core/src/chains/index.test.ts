import { describe, expect, it } from 'vitest';
import { CfxError } from '../errors/index.js';
import {
  coreSpaceMainnet,
  coreSpaceTestnet,
  defineChain,
  espaceLocal,
  espaceMainnet,
  espaceTestnet,
  getChain,
  listChains,
} from './index.js';

describe('chains catalog', () => {
  it('exposes the documented six chains', () => {
    const all = listChains();
    expect(all).toHaveLength(6);
    expect(all.map((c) => c.id).sort((a, b) => a - b)).toEqual([1, 71, 1029, 1030, 2029, 2030]);
  });

  it('eSpace mainnet has expected id and RPC', () => {
    expect(espaceMainnet.id).toBe(1030);
    expect(espaceMainnet.family).toBe('espace');
    expect(espaceMainnet.network).toBe('mainnet');
    expect(espaceMainnet.rpc.http[0]).toBe('https://evm.confluxrpc.com');
  });

  it('eSpace testnet has expected id and RPC', () => {
    expect(espaceTestnet.id).toBe(71);
    expect(espaceTestnet.rpc.http[0]).toBe('https://evmtestnet.confluxrpc.com');
  });

  it('Core Space mainnet/testnet ids match Conflux specs', () => {
    expect(coreSpaceMainnet.id).toBe(1029);
    expect(coreSpaceTestnet.id).toBe(1);
  });

  it('local chains exist for both families', () => {
    expect(espaceLocal.network).toBe('local');
    expect(espaceLocal.family).toBe('espace');
  });

  it('getChain accepts numeric id and slug', () => {
    expect(getChain(1030)).toBe(espaceMainnet);
    expect(getChain('espace-mainnet')).toBe(espaceMainnet);
  });

  it('getChain throws CfxError on unknown id', () => {
    let caught: unknown;
    try {
      getChain(999_999);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(CfxError);
    expect((caught as CfxError).code).toBe('core/chains/unknown');
  });

  it('listChains filters by family and network', () => {
    expect(listChains({ family: 'espace' })).toHaveLength(3);
    expect(listChains({ network: 'mainnet' })).toHaveLength(2);
    expect(listChains({ family: 'core', network: 'testnet' })).toHaveLength(1);
  });

  it('defineChain validates id and rpc', () => {
    expect(() =>
      defineChain({
        id: 0,
        name: 'bad',
        displayName: 'Bad',
        network: 'local',
        family: 'espace',
        nativeToken: { symbol: 'X', decimals: 18 },
        rpc: { http: ['http://x'] },
      }),
    ).toThrow(/positive integer/);

    expect(() =>
      defineChain({
        id: 1234,
        name: '',
        displayName: 'No name',
        network: 'local',
        family: 'espace',
        nativeToken: { symbol: 'X', decimals: 18 },
        rpc: { http: [] },
      }),
    ).toThrow(/HTTP RPC/);
  });
});
