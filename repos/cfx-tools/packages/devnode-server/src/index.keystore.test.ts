import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deriveAccount } from '@cfxdevkit/core';
import { describe, expect, it } from 'vitest';
import { createDevnodeServerApp } from './index.js';
import { createMockNode, TEST_MNEMONIC } from './index.test-support.js';

describe('@cfxdevkit/devnode-server keystore flows', () => {
  it('manages wallets through the keystore api', async () => {
    const keystorePath = join(tmpdir(), `cfxdevkit-keystore-${Date.now()}.json`);
    const app = createDevnodeServerApp({ createNode: createMockNode, keystorePath });

    try {
      const setup = await app.request('/keystore/setup', {
        method: 'POST',
        body: JSON.stringify({ passphrase: 'secret-passphrase' }),
      });
      await expect(setup.json()).resolves.toMatchObject({ ok: true, walletCount: 0 });

      const added = await app.request('/keystore/wallets', {
        method: 'POST',
        body: JSON.stringify({ mnemonic: TEST_MNEMONIC, name: 'Primary', accountCount: 3 }),
      });
      await expect(added.json()).resolves.toMatchObject({
        ok: true,
        wallet: { name: 'Primary', active: true, accountCount: 3, activeAccountIndex: 0 },
      });

      const listed = await app.request('/keystore/wallets');
      const listedJson = (await listed.json()) as {
        ok: boolean;
        wallets: Array<{ id: string; name: string; active: boolean; accountCount: number }>;
      };
      expect(listedJson).toMatchObject({
        ok: true,
        wallets: [{ name: 'Primary', active: true, accountCount: 3 }],
      });

      const [wallet] = listedJson.wallets;
      expect(wallet).toBeDefined();
      if (!wallet) throw new Error('expected a wallet to be created');

      const activeInitial = await app.request('/keystore/active');
      await expect(activeInitial.json()).resolves.toMatchObject({
        ok: true,
        wallet: { id: wallet.id, name: 'Primary', activeAccountIndex: 0 },
      });

      const accounts = await app.request(`/keystore/wallets/${wallet.id}/accounts`);
      const accountsJson = (await accounts.json()) as {
        ok: boolean;
        accounts: Array<{ index: number; active: boolean; address: string }>;
      };
      expect(accountsJson.ok).toBe(true);
      expect(accountsJson.accounts).toHaveLength(3);
      expect(accountsJson.accounts[0]).toMatchObject({ index: 0, active: true });
      expect(accountsJson.accounts[2]).toMatchObject({ index: 2, active: false });

      const activateAccount = await app.request(
        `/keystore/wallets/${wallet.id}/accounts/2/activate`,
        {
          method: 'PUT',
        },
      );
      await expect(activateAccount.json()).resolves.toMatchObject({ ok: true });

      const activeAfter = await app.request('/keystore/active');
      const activeAfterJson = (await activeAfter.json()) as {
        ok: boolean;
        wallet: { activeAccountIndex: number; address: string; derivationPath: string };
      };
      const expectedAccount = deriveAccount({ mnemonic: TEST_MNEMONIC, path: "m/44'/60'/0'/0/2" });
      expect(activeAfterJson).toMatchObject({
        ok: true,
        wallet: {
          activeAccountIndex: 2,
          address: expectedAccount.account.address,
          derivationPath: "m/44'/60'/0'/0/2",
        },
      });

      const revealRequest = await app.request('/keystore/reveal/request', {
        method: 'POST',
        body: JSON.stringify({
          walletId: wallet.id,
          passphrase: 'secret-passphrase',
          kind: 'private-key',
          accountIndex: 2,
        }),
      });
      const revealRequestJson = (await revealRequest.json()) as {
        ok: boolean;
        request: { token: string; kind: string; accountIndex?: number };
      };
      expect(revealRequestJson).toMatchObject({
        ok: true,
        request: { kind: 'private-key', accountIndex: 2 },
      });

      const revealConsume = await app.request('/keystore/reveal/consume', {
        method: 'POST',
        body: JSON.stringify({ token: revealRequestJson.request.token }),
      });
      await expect(revealConsume.json()).resolves.toMatchObject({
        ok: true,
        reveal: {
          kind: 'private-key',
          accountIndex: 2,
          derivationPath: "m/44'/60'/0'/0/2",
          privateKey: expectedAccount.privateKey,
          address: expectedAccount.account.address,
        },
      });

      const revealConsumeAgain = await app.request('/keystore/reveal/consume', {
        method: 'POST',
        body: JSON.stringify({ token: revealRequestJson.request.token }),
      });
      await expect(revealConsumeAgain.json()).resolves.toMatchObject({ ok: false });

      const revealBeforeLock = await app.request('/keystore/reveal/request', {
        method: 'POST',
        body: JSON.stringify({
          walletId: wallet.id,
          passphrase: 'secret-passphrase',
          kind: 'mnemonic',
        }),
      });
      const revealBeforeLockJson = (await revealBeforeLock.json()) as {
        ok: boolean;
        request: { token: string };
      };
      expect(revealBeforeLockJson.ok).toBe(true);

      const lock = await app.request('/keystore/lock', { method: 'POST' });
      await expect(lock.json()).resolves.toMatchObject({ ok: true });

      const revealAfterLock = await app.request('/keystore/reveal/consume', {
        method: 'POST',
        body: JSON.stringify({ token: revealBeforeLockJson.request.token }),
      });
      await expect(revealAfterLock.json()).resolves.toMatchObject({ ok: false });

      const unlock = await app.request('/keystore/unlock', {
        method: 'POST',
        body: JSON.stringify({ passphrase: 'secret-passphrase' }),
      });
      await expect(unlock.json()).resolves.toMatchObject({ ok: true });

      const renamed = await app.request(`/keystore/wallets/${wallet.id}/rename`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Primary Renamed' }),
      });
      await expect(renamed.json()).resolves.toMatchObject({ ok: true });

      const relisted = await app.request('/keystore/wallets');
      await expect(relisted.json()).resolves.toMatchObject({
        ok: true,
        wallets: [{ name: 'Primary Renamed', active: true }],
      });
    } finally {
      await rm(keystorePath, { force: true });
    }
  }, 20000);
});
