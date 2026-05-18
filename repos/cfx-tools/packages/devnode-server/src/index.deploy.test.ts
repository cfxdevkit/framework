import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDevnodeServerApp } from './index.js';
import {
  createMockNode,
  deployContractMock,
  readContractMock,
  sendWriteMock,
  TEST_MNEMONIC,
} from './index.test-support.js';

describe('@cfxdevkit/devnode-server deploy and writes', () => {
  it('deploys through the shared runtime api and registers the contract', async () => {
    deployContractMock.mockResolvedValueOnce({
      address: '0x00000000000000000000000000000000000000aa',
      hash: '0xabc',
      receipt: {
        blockHash: '0xdef',
        blockNumber: 12n,
        status: 'success',
        transactionHash: '0xabc',
      },
    });

    const keystorePath = join(tmpdir(), `cfxdevkit-deploy-${Date.now()}.json`);
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
      await app.request('/node/start', { method: 'POST' });

      const deployed = await app.request('/deploy/run', {
        method: 'POST',
        body: JSON.stringify({
          abi: [],
          bytecode: '0x60006000',
          contractName: 'Counter',
          network: 'local',
          space: 'espace',
        }),
      });
      await expect(deployed.json()).resolves.toMatchObject({
        ok: true,
        address: '0x00000000000000000000000000000000000000aa',
        hash: '0xabc',
        network: 'local',
        space: 'espace',
      });

      const contracts = await app.request('/contracts?network=local&space=espace');
      await expect(contracts.json()).resolves.toMatchObject({
        ok: true,
        contracts: [
          {
            name: 'Counter',
            address: '0x00000000000000000000000000000000000000aa',
            network: 'local',
            space: 'espace',
            chainId: 2030,
          },
        ],
      });
    } finally {
      deployContractMock.mockReset();
      await rm(keystorePath, { force: true });
    }
  }, 30000);

  it('deploys through the active public network profile with request signer override', async () => {
    deployContractMock.mockResolvedValueOnce({
      address: '0x00000000000000000000000000000000000000bb',
      hash: '0xpublicdeploy',
      receipt: {
        blockHash: '0xpublicblock',
        blockNumber: 33n,
        status: 'success',
        transactionHash: '0xpublicdeploy',
      },
    });

    const keystorePath = join(tmpdir(), `cfxdevkit-public-deploy-${Date.now()}.json`);
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

      const deployed = await app.request('/deploy/run', {
        method: 'POST',
        body: JSON.stringify({
          abi: [],
          bytecode: '0x60006000',
          contractName: 'Public Counter',
          privateKey: `0x${'1'.repeat(64)}`,
          space: 'espace',
        }),
      });
      await expect(deployed.json()).resolves.toMatchObject({
        ok: true,
        address: '0x00000000000000000000000000000000000000bb',
        contractId: expect.any(String),
        hash: '0xpublicdeploy',
        mode: 'public',
        network: 'testnet',
        signerAccountIndex: 0,
        signerSource: 'request',
        space: 'espace',
      });

      const contracts = await app.request('/contracts?network=testnet&space=espace');
      await expect(contracts.json()).resolves.toMatchObject({
        ok: true,
        contracts: [
          {
            name: 'Public Counter',
            network: 'testnet',
            space: 'espace',
            metadata: {
              mode: 'public',
              signerAccountIndex: 0,
              signerSource: 'request',
            },
          },
        ],
      });
    } finally {
      deployContractMock.mockReset();
      await rm(keystorePath, { force: true });
      await rm(runtimeStateRoot, { recursive: true, force: true });
    }
  }, 30000);

  it('reads contract state through the shared runtime api', async () => {
    readContractMock.mockResolvedValueOnce(42n);
    const app = createDevnodeServerApp({ createNode: createMockNode });
    const response = await app.request('/contracts/read', {
      method: 'POST',
      body: JSON.stringify({
        abi: [],
        address: '0x0000000000000000000000000000000000000001',
        functionName: 'value',
        network: 'testnet',
        space: 'espace',
      }),
    });
    await expect(response.json()).resolves.toMatchObject({ ok: true, result: '42' });
    readContractMock.mockReset();
  });

  it('writes contract state through the shared runtime api', async () => {
    sendWriteMock.mockResolvedValueOnce({
      hash: '0xwrite',
      receipt: { blockNumber: 13n, status: 'success', transactionHash: '0xwrite' },
    });

    const keystorePath = join(tmpdir(), `cfxdevkit-contract-write-${Date.now()}.json`);
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
      await app.request('/node/start', { method: 'POST' });

      const response = await app.request('/contracts/write', {
        method: 'POST',
        body: JSON.stringify({
          abi: [],
          address: '0x0000000000000000000000000000000000000001',
          functionName: 'increment',
          network: 'local',
          space: 'espace',
        }),
      });
      await expect(response.json()).resolves.toMatchObject({
        ok: true,
        hash: '0xwrite',
        receipt: { blockNumber: '13', status: 'success', transactionHash: '0xwrite' },
      });
    } finally {
      sendWriteMock.mockReset();
      await rm(keystorePath, { force: true });
    }
  }, 30000);
});
