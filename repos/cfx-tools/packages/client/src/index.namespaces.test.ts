import { describe, expect, it } from 'vitest';
import { ConfluxDevkitClient } from './index.js';
import { mockFetch } from './test-helpers.js';

describe('@cfxdevkit/client namespaces', () => {
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
});
