import { describe, expect, it } from 'vitest';
import { createSupportedEspaceChains } from './chains.js';

describe('createSupportedEspaceChains', () => {
  it('maps framework chain definitions into wagmi-compatible viem chains', () => {
    const chains = createSupportedEspaceChains();
    expect(chains.map((chain) => chain.id)).toEqual([1030, 71, 2030]);
    expect(chains[0].rpcUrls.default.http[0]).toBe('https://evm.confluxrpc.com');
  });

  it('supports overriding the local RPC URL', () => {
    const [, , local] = createSupportedEspaceChains({ localRpcUrl: 'http://127.0.0.1:9999' });
    expect(local.rpcUrls.default.http).toEqual(['http://127.0.0.1:9999']);
  });
});
