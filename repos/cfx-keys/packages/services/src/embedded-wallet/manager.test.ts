import { describe, expect, it } from 'vitest';
import { createMemoryKeystore } from '../keystore/memory/index.js';
import { createEmbeddedWalletManager } from './manager.js';

describe('KeystoreEmbeddedWalletManager', () => {
  it('creates and loads wallet metadata without exposing key material', async () => {
    const manager = createEmbeddedWalletManager({ provider: createMemoryKeystore() });

    const wallet = await manager.createWallet('alice');
    const loaded = await manager.getWallet('alice');

    expect(await manager.hasWallet('alice')).toBe(true);
    expect(loaded).toEqual(wallet);
    expect(loaded.espaceAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(loaded.coreAddress).toContain(':');
  });

  it('returns a signer for a managed wallet', async () => {
    const manager = createEmbeddedWalletManager({ provider: createMemoryKeystore() });
    const wallet = await manager.createWallet('bob');

    const signer = await manager.signerFor('bob');
    const signature = await signer.signMessage('hello');

    expect(signer.account.address).toBe(wallet.espaceAddress);
    expect(signature).toMatch(/^0x[0-9a-fA-F]+$/);
  });

  it('deletes a managed wallet', async () => {
    const manager = createEmbeddedWalletManager({ provider: createMemoryKeystore() });
    await manager.createWallet('carol');
    await manager.deleteWallet('carol');

    await expect(manager.hasWallet('carol')).resolves.toBe(false);
  });
});
