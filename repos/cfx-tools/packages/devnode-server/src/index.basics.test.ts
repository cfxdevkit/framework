import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDevnodeServerApp, DevnodeServerController } from './index.js';
import { createMockNode, TEST_MNEMONIC } from './index.test-support.js';

describe('@cfxdevkit/devnode-server basics', () => {
  it('returns stopped status before a node is started', async () => {
    const app = createDevnodeServerApp({ createNode: createMockNode });
    const response = await app.request('/node/status');
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      node: { status: 'stopped', running: false, accounts: [] },
    });
  });

  it('starts and mines through the Hono API', async () => {
    const app = createDevnodeServerApp({ createNode: createMockNode });
    const started = await app.request('/node/start', {
      method: 'POST',
      body: JSON.stringify({ config: { accounts: 2, dataDir: '/tmp/cfxdevkit-test' } }),
    });
    await expect(started.json()).resolves.toMatchObject({
      ok: true,
      node: { status: 'running', running: true, config: { accounts: 2 } },
    });

    const mined = await app.request('/node/mine', {
      method: 'POST',
      body: JSON.stringify({ blocks: 3 }),
    });
    await expect(mined.json()).resolves.toMatchObject({ ok: true, node: { mining: { ticks: 3 } } });
  });

  it('wipes the active data directory and can restart', async () => {
    const removed: string[] = [];
    const controller = new DevnodeServerController({
      createNode: createMockNode,
      removeDataDir: async (path) => {
        removed.push(path);
      },
    });
    await controller.start({ config: { dataDir: '/tmp/devnode-a' } });
    const status = await controller.wipe({ restart: true });
    expect(removed).toEqual(['/tmp/devnode-a']);
    expect(status).toMatchObject({ status: 'running', running: true });
  });

  it('filters registered contracts by network and space', async () => {
    const app = createDevnodeServerApp({ createNode: createMockNode });

    const registeredLocal = await app.request('/contracts/register', {
      method: 'POST',
      body: JSON.stringify({
        abi: [],
        address: '0x0000000000000000000000000000000000000001',
        name: 'Local Counter',
        network: 'local',
        space: 'espace',
      }),
    });
    await expect(registeredLocal.json()).resolves.toMatchObject({
      ok: true,
      contract: { chainId: 2030, network: 'local', space: 'espace' },
    });

    await app.request('/contracts/register', {
      method: 'POST',
      body: JSON.stringify({
        abi: [],
        address: '0x0000000000000000000000000000000000000002',
        name: 'Testnet Counter',
        network: 'testnet',
        space: 'espace',
      }),
    });
    await app.request('/contracts/register', {
      method: 'POST',
      body: JSON.stringify({
        abi: [],
        address: 'cfxtest:contract0',
        name: 'Local Core Contract',
        network: 'local',
        space: 'core',
      }),
    });

    const localEspace = await app.request('/contracts?network=local&space=espace');
    await expect(localEspace.json()).resolves.toMatchObject({
      ok: true,
      contracts: [{ name: 'Local Counter', network: 'local', space: 'espace', chainId: 2030 }],
    });
    const localCore = await app.request('/contracts?network=local&space=core');
    await expect(localCore.json()).resolves.toMatchObject({
      ok: true,
      contracts: [{ name: 'Local Core Contract', network: 'local', space: 'core', chainId: 2029 }],
    });
    const testnetEspace = await app.request('/contracts?network=testnet&chainId=71');
    await expect(testnetEspace.json()).resolves.toMatchObject({
      ok: true,
      contracts: [{ name: 'Testnet Counter', network: 'testnet', space: 'espace', chainId: 71 }],
    });
  });

  it('compiles sources through the shared compiler api', async () => {
    const app = createDevnodeServerApp({ createNode: createMockNode });
    const response = await app.request('/compiler/sources', {
      method: 'POST',
      body: JSON.stringify({
        contractName: 'Counter',
        solcVersion: '0.8.26',
        source: 'pragma solidity ^0.8.26; contract Counter { uint256 public value; }',
      }),
    });
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      contractName: 'Counter',
      abi: expect.any(Array),
      bytecode: expect.stringMatching(/^0x/),
    });
  });

  it('issues and verifies a session key through the shared api', async () => {
    const keystorePath = join(tmpdir(), `cfxdevkit-session-key-${Date.now()}.json`);
    const app = createDevnodeServerApp({ createNode: createMockNode, keystorePath });
    const capability = {
      chains: [2030],
      contracts: ['0x0000000000000000000000000000000000000001'],
      maxValuePerTx: '0',
      notAfter: Date.now() + 60_000,
      selectors: ['0xa9059cbb'],
    };

    try {
      await app.request('/keystore/setup', {
        method: 'POST',
        body: JSON.stringify({ passphrase: 'secret-passphrase' }),
      });
      await app.request('/keystore/wallets', {
        method: 'POST',
        body: JSON.stringify({ mnemonic: TEST_MNEMONIC, name: 'Primary' }),
      });

      const issued = await app.request('/session-key/issue', {
        method: 'POST',
        body: JSON.stringify({ capability }),
      });
      const issuedJson = (await issued.json()) as {
        attestation: { signature: string };
        ok: boolean;
        parent: string;
        session: string;
      };
      expect(issuedJson.ok).toBe(true);

      const verified = await app.request('/session-key/verify', {
        method: 'POST',
        body: JSON.stringify({
          capability,
          parent: issuedJson.parent,
          session: issuedJson.session,
          signature: issuedJson.attestation.signature,
        }),
      });
      await expect(verified.json()).resolves.toMatchObject({ ok: true, valid: true });
    } finally {
      await rm(keystorePath, { force: true });
    }
  }, 20000);
});
