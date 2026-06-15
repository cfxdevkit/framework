import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { createDevnodeServerApp } from './index.js';
import { createMockNode, SECOND_TEST_MNEMONIC, TEST_MNEMONIC } from './index.test-support.js';

describe('@cfxdevkit/devnode-server network profiles', () => {
  it('persists wallet-scoped network profiles and guards local node start in public mode', async () => {
    const keystorePath = `${tmpdir()}/cfxdevkit-network-${Date.now()}.json`;
    const runtimeStateRoot = `${keystorePath}.runtime`;
    const app = createDevnodeServerApp({ createNode: createMockNode, keystorePath });

    try {
      await app.request('/keystore/setup', {
        method: 'POST',
        body: JSON.stringify({ passphrase: 'secret-passphrase' }),
      });

      const primaryAdd = await app.request('/keystore/wallets', {
        method: 'POST',
        body: JSON.stringify({ mnemonic: TEST_MNEMONIC, name: 'Primary' }),
      });
      const primary = (await primaryAdd.json()) as { ok: boolean; wallet: { id: string } };

      const initialCurrent = await app.request('/network/current');
      await expect(initialCurrent.json()).resolves.toMatchObject({
        ok: true,
        walletId: primary.wallet.id,
        network: 'local',
        mode: 'local',
        chainIds: { core: 2029, espace: 2030 },
      });

      const switched = await app.request('/network/set', {
        method: 'POST',
        body: JSON.stringify({ network: 'testnet' }),
      });
      await expect(switched.json()).resolves.toMatchObject({
        ok: true,
        network: 'testnet',
        mode: 'public',
      });

      await app.request('/network/config', {
        method: 'POST',
        body: JSON.stringify({ key: 'coreRpc', value: 'https://custom.test.core' }),
      });
      await app.request('/network/config', {
        method: 'POST',
        body: JSON.stringify({ key: 'coreChainId', value: 999 }),
      });

      const blockedStart = await app.request('/node/start', { method: 'POST' });
      await expect(blockedStart.json()).resolves.toMatchObject({
        ok: false,
        error: 'local devnode can only start when network mode is local',
      });

      const secondaryAdd = await app.request('/keystore/wallets', {
        method: 'POST',
        body: JSON.stringify({ mnemonic: SECOND_TEST_MNEMONIC, name: 'Secondary' }),
      });
      const secondary = (await secondaryAdd.json()) as { ok: boolean; wallet: { id: string } };

      const activateSecondary = await app.request(
        `/keystore/wallets/${secondary.wallet.id}/activate`,
        {
          method: 'PUT',
        },
      );
      await expect(activateSecondary.json()).resolves.toMatchObject({ ok: true });

      const secondaryCurrent = await app.request('/network/current');
      await expect(secondaryCurrent.json()).resolves.toMatchObject({
        ok: true,
        walletId: secondary.wallet.id,
        network: 'local',
        mode: 'local',
        chainIds: { core: 2029, espace: 2030 },
      });

      const activatePrimary = await app.request(`/keystore/wallets/${primary.wallet.id}/activate`, {
        method: 'PUT',
      });
      await expect(activatePrimary.json()).resolves.toMatchObject({ ok: true });

      const primaryCurrent = await app.request('/network/current');
      await expect(primaryCurrent.json()).resolves.toMatchObject({
        ok: true,
        walletId: primary.wallet.id,
        network: 'testnet',
        mode: 'public',
        coreRpc: 'https://custom.test.core',
        chainIds: { core: 999, espace: 71 },
      });

      const restoredApp = createDevnodeServerApp({ createNode: createMockNode, keystorePath });
      const unlocked = await restoredApp.request('/keystore/unlock', {
        method: 'POST',
        body: JSON.stringify({ passphrase: 'secret-passphrase' }),
      });
      await expect(unlocked.json()).resolves.toMatchObject({ ok: true });

      const restoredCurrent = await restoredApp.request('/network/current');
      await expect(restoredCurrent.json()).resolves.toMatchObject({
        ok: true,
        walletId: primary.wallet.id,
        network: 'testnet',
        mode: 'public',
        coreRpc: 'https://custom.test.core',
        chainIds: { core: 999, espace: 71 },
      });
    } finally {
      await rm(keystorePath, { force: true });
      await rm(runtimeStateRoot, { recursive: true, force: true });
    }
  }, 60000);
});
