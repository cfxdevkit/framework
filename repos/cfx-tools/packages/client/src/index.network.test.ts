import { describe, expect, it } from 'vitest';
import { ConfluxDevkitClient, createConfluxDevkitClient } from './index.js';
import { mockFetch } from './test-helpers.js';

describe('@cfxdevkit/client network and errors', () => {
  describe('ConfluxDevkitClient constructor', () => {
    it('creates an instance with all namespaces', () => {
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000' });
      expect(client.health).toBeDefined();
      expect(client.node).toBeDefined();
      expect(client.keystore).toBeDefined();
      expect(client.accounts).toBeDefined();
      expect(client.bootstrap).toBeDefined();
      expect(client.compiler).toBeDefined();
      expect(client.contracts).toBeDefined();
      expect(client.deploy).toBeDefined();
      expect(client.network).toBeDefined();
      expect(client.mining).toBeDefined();
      expect(client.sessionKeys).toBeDefined();
    });

    it('createConfluxDevkitClient returns same shape', () => {
      const client = createConfluxDevkitClient({ baseUrl: 'http://localhost:52000' });
      expect(client).toBeInstanceOf(ConfluxDevkitClient);
    });
  });

  describe('network namespace', () => {
    it('checks runtime health', async () => {
      const fetch = mockFetch({
        'GET /health': { body: { ok: true } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      await expect(client.health()).resolves.toMatchObject({ ok: true });
    });

    it('fetches current network', async () => {
      const fetch = mockFetch({
        'GET /network/current': {
          body: {
            ok: true,
            walletId: 'wallet-1',
            mode: 'local',
            network: 'local',
            chainIds: { core: 2029, espace: 2030 },
            espaceRpc: 'http://127.0.0.1:8545',
            coreRpc: 'http://127.0.0.1:12537',
          },
        },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.network.current();
      expect(result.network).toBe('local');
      expect(result.chainIds.espace).toBe(2030);
    });

    it('fetches network capabilities', async () => {
      const fetch = mockFetch({
        'GET /network/capabilities': {
          body: {
            ok: true,
            mode: 'public',
            capabilities: {
              faucet: false,
              mining: false,
              contractDeployLocal: false,
              contractDeployPublic: true,
              contractReadPublic: true,
              contractWritePublic: true,
            },
          },
        },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.network.capabilities();
      expect(result.mode).toBe('public');
      expect(result.capabilities.contractWritePublic).toBe(true);
    });

    it('updates network config and chain ids', async () => {
      const fetch = mockFetch({
        'POST /network/config': {
          body: {
            ok: true,
            config: {
              espaceRpc: 'https://evmtestnet.confluxrpc.com',
              coreRpc: 'https://test.confluxrpc.com',
            },
            chainIds: { core: 1, espace: 71 },
          },
        },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.network.setConfig('espaceChainId', 71);
      expect(result.chainIds.espace).toBe(71);
    });

    it('sets the network', async () => {
      const fetch = mockFetch({
        'POST /network/set': {
          body: {
            ok: true,
            walletId: 'wallet-1',
            mode: 'public',
            network: 'testnet',
            chainIds: { core: 1, espace: 71 },
            espaceRpc: 'https://evmtestnet.confluxrpc.com',
            coreRpc: 'https://test.confluxrpc.com',
          },
        },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.network.set('testnet');
      expect(result.network).toBe('testnet');
      expect(result.mode).toBe('public');
    });
  });

  describe('mining namespace', () => {
    it('fetches mining status', async () => {
      const fetch = mockFetch({
        'GET /mining/status': { body: { ok: true, running: false, intervalMs: null } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.mining.status();
      expect(result.running).toBe(false);
    });

    it('starts mining', async () => {
      const fetch = mockFetch({
        'POST /mining/start': { body: { ok: true, running: true, intervalMs: 2000 } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.mining.start({ intervalMs: 2000 });
      expect(result.running).toBe(true);
      expect(result.intervalMs).toBe(2000);
    });
  });

  describe('error handling', () => {
    it('throws on server error with error message', async () => {
      const fetch = mockFetch({
        'GET /node/status': { status: 503, body: { ok: false, error: 'node not running' } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      await expect(client.node.status()).rejects.toThrow('node not running');
    });

    it('throws on non-JSON response', async () => {
      const customFetch: typeof globalThis.fetch = async () =>
        new Response('Internal Server Error', { status: 500 });
      const client = new ConfluxDevkitClient({
        baseUrl: 'http://localhost:52000',
        fetch: customFetch,
      });
      await expect(client.node.status()).rejects.toThrow('non-JSON');
    });
  });
});
