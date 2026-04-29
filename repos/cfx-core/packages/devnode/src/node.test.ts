import { describe, expect, it } from 'vitest';
import { createDevNode } from './node.js';

const TEST_MNEMONIC = 'test test test test test test test test test test test junk';

describe('createDevNode (offline)', () => {
  it('applies sensible defaults that match coreSpaceLocal/espaceLocal', () => {
    const node = createDevNode({ mnemonic: TEST_MNEMONIC });
    expect(node.config.chainId).toBe(2029);
    expect(node.config.evmChainId).toBe(2030);
    expect(node.config.coreRpcPort).toBe(12537);
    expect(node.config.evmRpcPort).toBe(8545);
    expect(node.urls.core).toBe('http://127.0.0.1:12537');
    expect(node.urls.espace).toBe('http://127.0.0.1:8545');
    expect(node.urls.coreWs).toBe('ws://127.0.0.1:12536');
  });

  it('derives exactly `accounts` pre-funded dual-address accounts', () => {
    const node = createDevNode({ mnemonic: TEST_MNEMONIC, accounts: 4 });
    expect(node.accounts).toHaveLength(4);
    for (const a of node.accounts) {
      expect(a.evmAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
      // chainId=2029 → custom net2029 base32 prefix.
      expect(a.coreAddress.startsWith('net2029:')).toBe(true);
      expect(a.initialBalanceCfx).toBe('1000000');
    }
    // Independent indices yield distinct addresses.
    const evmSet = new Set(node.accounts.map((a) => a.evmAddress));
    expect(evmSet.size).toBe(4);
  });

  it('exposes a separate faucet/mining account from a different derivation path', () => {
    const node = createDevNode({ mnemonic: TEST_MNEMONIC });
    expect(node.faucet.privateKey).not.toBe(node.accounts[0]?.privateKey);
    expect(node.faucet.paths.core).toContain("44'/503'/1'");
  });

  it('allows overriding ports + accounts + balance', () => {
    const node = createDevNode({
      mnemonic: TEST_MNEMONIC,
      coreRpcPort: 22537,
      evmRpcPort: 28545,
      accounts: 2,
      balanceCfx: '50',
    });
    expect(node.urls.core).toBe('http://127.0.0.1:22537');
    expect(node.urls.espace).toBe('http://127.0.0.1:28545');
    expect(node.accounts).toHaveLength(2);
    expect(node.accounts[0]?.initialBalanceCfx).toBe('50');
  });

  it('rejects an invalid mnemonic', () => {
    expect(() => createDevNode({ mnemonic: 'not a valid mnemonic' })).toThrow(/BIP-39/);
  });

  it('isRunning starts as false; getStatus is "stopped"', () => {
    const node = createDevNode({ mnemonic: TEST_MNEMONIC });
    expect(node.isRunning()).toBe(false);
    expect(node.getStatus()).toBe('stopped');
  });

  it('mining ops throw when the node has not been started', async () => {
    const node = createDevNode({ mnemonic: TEST_MNEMONIC });
    await expect(node.mine(1)).rejects.toThrow(/not running/);
    await expect(node.startMining(500)).rejects.toThrow(/not running/);
  });
});
