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

    it('reads and selects node profiles', async () => {
      const fetch = mockFetch({
        'GET /node/profile': {
          body: {
            ok: true,
            locked: false,
            profiles: [
              {
                id: 'wallet-1',
                name: 'Wallet 1',
                dataDir: '/tmp/profile',
                selected: true,
                locked: false,
                accountCount: 3,
              },
            ],
            selectedProfile: {
              id: 'wallet-1',
              name: 'Wallet 1',
              dataDir: '/tmp/profile',
              selected: true,
              locked: false,
              accountCount: 3,
            },
          },
        },
        'PUT /node/profile/wallet-1/select': {
          body: { ok: true, profile: { id: 'wallet-1', name: 'Wallet 1' } },
        },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const profiles = await client.node.profiles();
      const selection = await client.node.selectProfile('wallet-1');
      expect(profiles.selectedProfile?.id).toBe('wallet-1');
      expect(selection.profile?.id).toBe('wallet-1');
    });
  });

  describe('keystore namespace', () => {
    it('fetches keystore status', async () => {
      const fetch = mockFetch({
        'GET /keystore/status': {
          body: {
            ok: true,
            phase: 'blank',
            locked: true,
            initialized: false,
            walletCount: 0,
            reset: {
              destructive: true,
              mode: 'cli',
              paths: ['/tmp/keystore.json', '/tmp/keystore.json.runtime'],
              requiresNodeStop: true,
              warning: 'Reset deletes the keystore and runtime state.',
            },
          },
        },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.keystore.status();
      expect(result.locked).toBe(true);
      expect(result.walletCount).toBe(0);
      expect(result.phase).toBe('blank');
      expect(result.reset?.mode).toBe('cli');
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
      const wallets = [
        {
          id: 'w1',
          name: 'Main',
          active: true,
          accountCount: 3,
          activeAccountIndex: 0,
          accountType: 'standard' as const,
        },
      ];
      const fetch = mockFetch({
        'GET /keystore/wallets': { body: { ok: true, wallets } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const result = await client.keystore.wallets.list();
      expect(result.wallets).toHaveLength(1);
      expect(result.wallets[0].name).toBe('Main');
    });

    it('reads active wallet and wallet accounts', async () => {
      const fetch = mockFetch({
        'GET /keystore/active': {
          body: {
            ok: true,
            wallet: {
              id: 'w1',
              name: 'Main',
              active: true,
              accountCount: 3,
              activeAccountIndex: 1,
              accountType: 'standard' as const,
              espaceAddress: '0x1',
              coreAddress: 'cfxtest:a',
              espaceDerivationPath: "m/44'/60'/0'/0/1",
              coreDerivationPath: "m/44'/503'/0'/0/1",
            },
          },
        },
        'GET /keystore/wallets/w1/accounts': {
          body: {
            ok: true,
            accounts: [
              {
                index: 1,
                espaceDerivationPath: "m/44'/60'/0'/0/1",
                espaceAddress: '0x1',
                coreAddress: 'cfxtest:a',
                coreDerivationPath: "m/44'/503'/0'/0/1",
                active: true,
              },
            ],
          },
        },
        'PUT /keystore/wallets/w1/activate': { body: { ok: true } },
        'PUT /keystore/wallets/w1/accounts/1/activate': { body: { ok: true } },
      });
      const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000', fetch });
      const active = await client.keystore.active();
      const accounts = await client.keystore.wallets.accounts('w1');
      const activated = await client.keystore.wallets.activate('w1', { accountIndex: 1 });
      const accountActivated = await client.keystore.wallets.activateAccount('w1', 1);
      expect(active.wallet?.activeAccountIndex).toBe(1);
      expect(accounts.accounts[0].index).toBe(1);
      expect(activated.ok).toBe(true);
      expect(accountActivated.ok).toBe(true);
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
