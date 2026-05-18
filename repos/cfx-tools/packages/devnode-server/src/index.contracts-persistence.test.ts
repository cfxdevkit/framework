import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDevnodeServerApp } from './index.js';
import {
  createMockNode,
  readContractMock,
  SECOND_TEST_MNEMONIC,
  sendCoreFundsMock,
  sendWriteMock,
  TEST_MNEMONIC,
} from './index.test-support.js';

describe('@cfxdevkit/devnode-server contracts persistence', () => {
  it('calls tracked contracts by id in public mode', async () => {
    readContractMock.mockResolvedValueOnce(42n);
    sendWriteMock.mockResolvedValueOnce({
      hash: '0xtrackedwrite',
      receipt: { blockNumber: 44n, status: 'success', transactionHash: '0xtrackedwrite' },
    });

    const keystorePath = join(tmpdir(), `cfxdevkit-tracked-call-${Date.now()}.json`);
    const runtimeStateRoot = `${keystorePath}.runtime`;
    const app = createDevnodeServerApp({ createNode: createMockNode, keystorePath });
    try {
      await app.request('/keystore/setup', {
        method: 'POST',
        body: JSON.stringify({ passphrase: 'secret-passphrase' }),
      });
      await app.request('/keystore/wallets', {
        method: 'POST',
        body: JSON.stringify({ mnemonic: TEST_MNEMONIC, name: 'Primary' }),
      });
      await app.request('/network/set', {
        method: 'POST',
        body: JSON.stringify({ network: 'testnet' }),
      });

      const registered = await app.request('/contracts/register', {
        method: 'POST',
        body: JSON.stringify({
          abi: [
            { inputs: [], name: 'value', outputs: [], stateMutability: 'view', type: 'function' },
            {
              inputs: [],
              name: 'increment',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          address: '0x0000000000000000000000000000000000000001',
          name: 'Tracked Counter',
          network: 'testnet',
          space: 'espace',
        }),
      });
      const registeredJson = (await registered.json()) as { contract: { id: string } };

      const readById = await app.request(`/contracts/${registeredJson.contract.id}/call`, {
        method: 'POST',
        body: JSON.stringify({ functionName: 'value' }),
      });
      await expect(readById.json()).resolves.toMatchObject({ ok: true, result: '42' });

      const writeById = await app.request(`/contracts/${registeredJson.contract.id}/call`, {
        method: 'POST',
        body: JSON.stringify({
          functionName: 'increment',
          privateKey: `0x${'2'.repeat(64)}`,
        }),
      });
      await expect(writeById.json()).resolves.toMatchObject({
        ok: true,
        hash: '0xtrackedwrite',
        signerAccountIndex: 0,
        signerSource: 'request',
      });
    } finally {
      readContractMock.mockReset();
      sendWriteMock.mockReset();
      await rm(keystorePath, { force: true });
      await rm(runtimeStateRoot, { recursive: true, force: true });
    }
  }, 30000);

  it('persists tracked contracts across app restarts and wallet switches', async () => {
    const keystorePath = join(tmpdir(), `cfxdevkit-contract-persistence-${Date.now()}.json`);
    const runtimeStateRoot = `${keystorePath}.runtime`;
    const app = createDevnodeServerApp({ createNode: createMockNode, keystorePath });
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
      if (!primaryId || !secondaryId) throw new Error('expected both wallets to exist');

      await app.request('/contracts/register', {
        method: 'POST',
        body: JSON.stringify({
          abi: [],
          address: '0x00000000000000000000000000000000000000cc',
          name: 'Primary Contract',
          network: 'testnet',
          space: 'espace',
        }),
      });

      const primaryContracts = await app.request('/contracts');
      await expect(primaryContracts.json()).resolves.toMatchObject({
        ok: true,
        contracts: [{ name: 'Primary Contract' }],
      });

      await app.request(`/keystore/wallets/${secondaryId}/activate`, { method: 'PUT' });
      const secondaryContracts = await app.request('/contracts');
      await expect(secondaryContracts.json()).resolves.toMatchObject({ ok: true, contracts: [] });

      await app.request(`/keystore/wallets/${primaryId}/activate`, { method: 'PUT' });
      const restoredPrimary = await app.request('/contracts');
      await expect(restoredPrimary.json()).resolves.toMatchObject({
        ok: true,
        contracts: [{ name: 'Primary Contract' }],
      });

      const restoredApp = createDevnodeServerApp({ createNode: createMockNode, keystorePath });
      await restoredApp.request('/keystore/unlock', {
        method: 'POST',
        body: JSON.stringify({ passphrase: 'secret-passphrase' }),
      });
      const persistedContracts = await restoredApp.request('/contracts');
      await expect(persistedContracts.json()).resolves.toMatchObject({
        ok: true,
        contracts: [{ name: 'Primary Contract' }],
      });
    } finally {
      await rm(keystorePath, { force: true });
      await rm(runtimeStateRoot, { recursive: true, force: true });
    }
  }, 30000);

  it('funds Core Space addresses through the shared accounts api', async () => {
    sendCoreFundsMock.mockResolvedValueOnce('0xcorefund');
    const app = createDevnodeServerApp({ createNode: createMockNode });
    await app.request('/node/start', { method: 'POST' });

    const response = await app.request('/accounts/fund', {
      method: 'POST',
      body: JSON.stringify({ address: 'cfxtest:acoremockaddress', amount: '1' }),
    });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      txHash: '0xcorefund',
      space: 'core',
    });
    expect(sendCoreFundsMock).toHaveBeenCalledTimes(1);
    sendCoreFundsMock.mockReset();
  });

  it('attaches custom runtime routes through the extension hook', async () => {
    const app = createDevnodeServerApp({
      createNode: createMockNode,
      extendApp: (runtimeApp) => {
        runtimeApp.get('/custom/ping', (context) => context.json({ ok: true, pong: true }));
      },
    });
    const response = await app.request('/custom/ping');
    await expect(response.json()).resolves.toMatchObject({ ok: true, pong: true });
  });
});
