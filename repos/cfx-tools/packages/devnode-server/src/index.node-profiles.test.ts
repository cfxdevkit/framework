import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDevnodeServerApp } from './index.js';
import { createMockNode, SECOND_TEST_MNEMONIC, TEST_MNEMONIC } from './index.test-support.js';

describe('@cfxdevkit/devnode-server node profiles', () => {
  it('selects a node profile from keystore wallets and locks it while running', async () => {
    const keystorePath = join(tmpdir(), `cfxdevkit-profile-keystore-${Date.now()}.json`);
    const dataRoot = join(tmpdir(), `cfxdevkit-profiles-${Date.now()}`);
    const app = createDevnodeServerApp({
      createNode: createMockNode,
      keystorePath,
      nodeProfileDataRoot: dataRoot,
    });

    try {
      await app.request('/keystore/setup', {
        method: 'POST',
        body: JSON.stringify({ passphrase: 'secret-passphrase' }),
      });
      const primary = await app.request('/keystore/wallets', {
        method: 'POST',
        body: JSON.stringify({ mnemonic: TEST_MNEMONIC, name: 'Primary' }),
      });
      const secondary = await app.request('/keystore/wallets', {
        method: 'POST',
        body: JSON.stringify({ mnemonic: SECOND_TEST_MNEMONIC, name: 'Secondary' }),
      });

      const primaryJson = (await primary.json()) as { wallet?: { id: string } };
      const secondaryJson = (await secondary.json()) as { wallet?: { id: string } };
      const primaryId = primaryJson.wallet?.id;
      const secondaryId = secondaryJson.wallet?.id;
      if (!primaryId || !secondaryId) {
        throw new Error('expected both node profile wallets to be created');
      }

      const initialProfiles = await app.request('/node/profile');
      await expect(initialProfiles.json()).resolves.toMatchObject({
        ok: true,
        locked: false,
        selectedProfile: { id: primaryId, dataDir: join(dataRoot, primaryId) },
      });

      const selected = await app.request(`/node/profile/${secondaryId}/select`, { method: 'PUT' });
      await expect(selected.json()).resolves.toMatchObject({
        ok: true,
        profile: { id: secondaryId, selected: true, dataDir: join(dataRoot, secondaryId) },
      });

      const started = await app.request('/node/start', { method: 'POST' });
      await expect(started.json()).resolves.toMatchObject({
        ok: true,
        node: {
          running: true,
          config: { dataDir: join(dataRoot, secondaryId), mnemonic: SECOND_TEST_MNEMONIC },
        },
      });

      const lockedProfiles = await app.request('/node/profile');
      await expect(lockedProfiles.json()).resolves.toMatchObject({
        ok: true,
        locked: true,
        selectedProfile: { id: secondaryId, dataDir: join(dataRoot, secondaryId), locked: true },
      });

      const switchWhileRunning = await app.request(`/node/profile/${primaryId}/select`, {
        method: 'PUT',
      });
      expect(switchWhileRunning.status).toBe(409);
      await expect(switchWhileRunning.json()).resolves.toMatchObject({
        ok: false,
        error: 'node profile cannot change while the node is running',
      });

      const stopped = await app.request('/node/stop', { method: 'POST' });
      await expect(stopped.json()).resolves.toMatchObject({ ok: true, node: { running: false } });

      const switchAfterStop = await app.request(`/node/profile/${primaryId}/select`, {
        method: 'PUT',
      });
      await expect(switchAfterStop.json()).resolves.toMatchObject({
        ok: true,
        profile: { id: primaryId, dataDir: join(dataRoot, primaryId), selected: true },
      });
    } finally {
      await rm(keystorePath, { force: true });
      await rm(dataRoot, { recursive: true, force: true });
    }
  }, 60000);
});
