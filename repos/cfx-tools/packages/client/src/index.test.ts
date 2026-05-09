import { describe, expect, it } from 'vitest';
import { ConfluxDevkitClient, createConfluxDevkitClient } from './index.js';

// ---------------------------------------------------------------------------
// Mock fetch factory
// ---------------------------------------------------------------------------

function mockFetch(responses: Record<string, { status?: number; body: unknown }>): typeof fetch {
  return async (input, init) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    const path = url.replace('http://localhost:52000', '');
    const method = (init?.method ?? 'GET').toUpperCase();
    const key = `${method} ${path}`;
    const entry = responses[key] ?? responses[path];
    if (!entry) throw new Error(`Unexpected fetch: ${key}`);
    const status = entry.status ?? 200;
    const text = JSON.stringify(entry.body);
    return new Response(text, {
      status,
      headers: { 'content-type': 'application/json' },
    });
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('@cfxdevkit/client', () => {
  describe('ConfluxDevkitClient constructor', () => {
    it('creates an instance with all namespaces', () => {
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000' });
      expect(client.node).toBeDefined();
      expect(client.keystore).toBeDefined();
      expect(client.accounts).toBeDefined();
      expect(client.contracts).toBeDefined();
      expect(client.network).toBeDefined();
      expect(client.mining).toBeDefined();
    });

    it('createConfluxDevkitClient returns same shape', () => {
      const client = createConfluxDevkitClient({ baseUrl: 'http://localhost:52000' });
      expect(client).toBeInstanceOf(ConfluxDevkitClient);
    });
  });

  describe('node namespace', () => {
    it('fetches node status', async () => {
      const fetch = mockFetch({
        'GET /node/status': { body: { ok: true, node: { status: 'stopped', running: false } } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.node.status();
      expect(result).toMatchObject({ ok: true, node: { status: 'stopped' } });
    });

    it('starts the node', async () => {
      const fetch = mockFetch({
        'POST /node/start': { body: { ok: true, node: { status: 'running', running: true } } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.node.start();
      expect(result.node.running).toBe(true);
    });
  });

  describe('keystore namespace', () => {
    it('fetches keystore status', async () => {
      const fetch = mockFetch({
        'GET /keystore/status': {
          body: { ok: true, locked: true, initialized: false, walletCount: 0 },
        },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.keystore.status();
      expect(result.locked).toBe(true);
      expect(result.walletCount).toBe(0);
    });

    it('unlocks the keystore', async () => {
      const fetch = mockFetch({
        'POST /keystore/unlock': { body: { ok: true } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.keystore.unlock({ passphrase: 'secret' });
      expect(result.ok).toBe(true);
    });

    it('lists wallets', async () => {
      const wallets = [{ id: 'w1', name: 'Main', active: true }];
      const fetch = mockFetch({
        'GET /keystore/wallets': { body: { ok: true, wallets } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.keystore.wallets.list();
      expect(result.wallets).toHaveLength(1);
      expect(result.wallets[0].name).toBe('Main');
    });
  });

  describe('accounts namespace', () => {
    it('lists accounts', async () => {
      const accounts = [
        { index: 0, evmAddress: '0x1', coreAddress: 'cfxtest:a', initialBalanceCfx: 1000 },
      ];
      const fetch = mockFetch({
        'GET /accounts': { body: { ok: true, accounts } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.accounts.list();
      expect(result.accounts).toHaveLength(1);
    });

    it('funds an espace address', async () => {
      const fetch = mockFetch({
        'POST /accounts/fund': { body: { ok: true, txHash: '0xabc', space: 'espace' } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.accounts.fund({ address: '0xdeadbeef', amount: 10 });
      expect(result.txHash).toBe('0xabc');
    });
  });

  describe('contracts namespace', () => {
    it('lists contracts', async () => {
      const fetch = mockFetch({
        'GET /contracts': { body: { ok: true, contracts: [] } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.contracts.list();
      expect(result.contracts).toHaveLength(0);
    });

    it('registers a contract', async () => {
      const contract = {
        id: 'c1',
        name: 'Token',
        address: '0x1',
        abi: [],
        space: 'espace',
        deployedAt: 0,
      };
      const fetch = mockFetch({
        'POST /contracts/register': { status: 201, body: { ok: true, contract } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.contracts.register({ name: 'Token', address: '0x1', abi: [] });
      expect(result.contract.name).toBe('Token');
    });
  });

  describe('network namespace', () => {
    it('fetches current network', async () => {
      const fetch = mockFetch({
        'GET /network/current': {
          body: {
            ok: true,
            network: 'local',
            espaceRpc: 'http://127.0.0.1:8545',
            coreRpc: 'http://127.0.0.1:12537',
          },
        },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.network.current();
      expect(result.network).toBe('local');
    });

    it('sets the network', async () => {
      const fetch = mockFetch({
        'POST /network/set': {
          body: {
            ok: true,
            network: 'testnet',
            espaceRpc: 'https://evmtestnet.confluxrpc.com',
            coreRpc: 'https://test.confluxrpc.com',
          },
        },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.network.set('testnet');
      expect(result.network).toBe('testnet');
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
