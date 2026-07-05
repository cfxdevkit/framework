import { describe, expect, it } from 'vitest';
import {
  coreSpaceMainnet,
  coreSpaceTestnet,
  coreSpaceLocal,
  espaceMainnet,
  espaceTestnet,
  espaceLocal,
  getChain,
  listChains,
} from '@cfxdevkit/cdk/chains';

describe('chains', () => {
  it('exports all chain configs', () => {
    expect(espaceMainnet.id).toBe(1030);
    expect(espaceTestnet.id).toBe(71);
    expect(espaceLocal.id).toBe(2030);
    expect(coreSpaceMainnet.id).toBe(1029);
    expect(coreSpaceTestnet.id).toBe(1);
    expect(coreSpaceLocal.id).toBe(2029);
  });

  it('chains have correct family', () => {
    expect(espaceMainnet.family).toBe('espace');
    expect(coreSpaceMainnet.family).toBe('core');
  });

  it('chains have RPC endpoints', () => {
    expect(espaceMainnet.rpc.http).toContain('https://evm.confluxrpc.com');
    expect(coreSpaceMainnet.rpc.http).toContain('https://main.confluxrpc.com');
  });

  it('getChain resolves by numeric id', () => {
    expect(getChain(1030)).toBe(espaceMainnet);
    expect(getChain(71)).toBe(espaceTestnet);
  });

  it('getChain resolves by slug name', () => {
    expect(getChain('espace-mainnet')).toBe(espaceMainnet);
    expect(getChain('core-testnet')).toBe(coreSpaceTestnet);
  });

  it('getChain throws on unknown chain', () => {
    expect(() => getChain(9999)).toThrow('Unknown chain');
  });

  it('listChains returns all chains unfiltered', () => {
    expect(listChains()).toHaveLength(6);
  });

  it('listChains filters by family', () => {
    expect(listChains({ family: 'espace' })).toHaveLength(3);
    expect(listChains({ family: 'core' })).toHaveLength(3);
  });

  it('listChains filters by network', () => {
    const mainnets = listChains({ network: 'mainnet' });
    expect(mainnets).toHaveLength(2);
    expect(mainnets[0]!.network).toBe('mainnet');
    expect(mainnets[1]!.network).toBe('mainnet');
  });

  it('listChains filters by family and network', () => {
    expect(listChains({ family: 'espace', network: 'mainnet' })).toHaveLength(1);
  });
});
