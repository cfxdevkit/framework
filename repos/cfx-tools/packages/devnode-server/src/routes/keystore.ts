import { Hono } from 'hono';
import type { KeystoreResetGuidance, KeystoreService } from '../keystore.js';

export function createKeystoreRoutes(
  keystore: KeystoreService,
  options: { reset?: KeystoreResetGuidance; network?: { chainIds(): { core: number } } } = {},
): Hono {
  const app = new Hono();

  app.get('/status', async (c) => {
    const s = await keystore.status();
    return c.json({ ok: true, ...s, ...(options.reset ? { reset: options.reset } : {}) });
  });

  app.post('/setup', async (c) => {
    const { passphrase } = await readBody<{ passphrase?: string }>(c);
    if (!passphrase) return c.json({ ok: false, error: 'passphrase is required' }, 400);
    try {
      await keystore.setup(passphrase);
      return c.json({ ok: true, walletCount: 0 });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 400);
    }
  });

  app.post('/unlock', async (c) => {
    const { passphrase } = await readBody<{ passphrase?: string }>(c);
    if (!passphrase) return c.json({ ok: false, error: 'passphrase is required' }, 400);
    try {
      await keystore.unlock(passphrase);
      return c.json({ ok: true });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 401);
    }
  });

  app.post('/lock', (c) => {
    keystore.lock();
    return c.json({ ok: true });
  });

  app.get('/active', async (c) => {
    try {
      const coreNetworkId = options.network?.chainIds().core;
      return c.json({ ok: true, wallet: await keystore.activeWallet(coreNetworkId) });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err), wallet: null }, 403);
    }
  });

  app.get('/wallets', (c) => {
    try {
      return c.json({ ok: true, wallets: keystore.listWallets() });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 403);
    }
  });

  app.post('/wallets', async (c) => {
    const { mnemonic, name, accountCount, accountType } = await readBody<{
      mnemonic?: string;
      name?: string;
      accountCount?: number;
      accountType?: string;
    }>(c);
    if (!mnemonic || !name) {
      return c.json({ ok: false, error: 'mnemonic and name are required' }, 400);
    }
    try {
      const wallet = await keystore.addWallet(mnemonic, name, {
        ...(accountCount === undefined ? {} : { accountCount }),
        ...(accountType === undefined ? {} : { accountType }),
      });
      return c.json({ ok: true, wallet });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 400);
    }
  });

  app.get('/wallets/:id/accounts', async (c) => {
    const id = c.req.param('id');
    try {
      const coreNetworkId = options.network?.chainIds().core;
      return c.json({ ok: true, accounts: await keystore.listAccounts(id, coreNetworkId) });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 404);
    }
  });

  app.put('/wallets/:id/activate', async (c) => {
    const id = c.req.param('id');
    const { accountIndex } = await readBody<{ accountIndex?: number }>(c);
    try {
      await keystore.activateWallet(id, accountIndex);
      return c.json({ ok: true });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 404);
    }
  });

  app.put('/wallets/:id/accounts/:index/activate', async (c) => {
    const id = c.req.param('id');
    const index = Number(c.req.param('index'));
    if (!Number.isInteger(index) || index < 0) {
      return c.json({ ok: false, error: 'index must be a non-negative integer' }, 400);
    }
    try {
      await keystore.activateAccount(id, index);
      return c.json({ ok: true });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 404);
    }
  });

  app.delete('/wallets/:id', async (c) => {
    const id = c.req.param('id');
    try {
      await keystore.deleteWallet(id);
      return c.json({ ok: true });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 404);
    }
  });

  app.patch('/wallets/:id/rename', async (c) => {
    const id = c.req.param('id');
    const { name } = await readBody<{ name?: string }>(c);
    if (!name) return c.json({ ok: false, error: 'name is required' }, 400);
    try {
      await keystore.renameWallet(id, name);
      return c.json({ ok: true });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 404);
    }
  });

  app.post('/reveal/request', async (c) => {
    const { walletId, passphrase, kind, accountIndex, ttlMs } = await readBody<{
      walletId?: string;
      passphrase?: string;
      kind?: 'mnemonic' | 'private-key';
      accountIndex?: number;
      ttlMs?: number;
    }>(c);
    if (!walletId) return c.json({ ok: false, error: 'walletId is required' }, 400);
    if (!passphrase) return c.json({ ok: false, error: 'passphrase is required' }, 400);
    if (kind !== 'mnemonic' && kind !== 'private-key') {
      return c.json({ ok: false, error: 'kind must be mnemonic or private-key' }, 400);
    }

    try {
      noStore(c);
      const request = await keystore.createRevealRequest({
        walletId,
        passphrase,
        kind,
        ...(accountIndex === undefined ? {} : { accountIndex }),
        ...(ttlMs === undefined ? {} : { ttlMs }),
      });
      return c.json({ ok: true, request });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 401);
    }
  });

  app.post('/reveal/consume', async (c) => {
    const { token } = await readBody<{ token?: string }>(c);
    if (!token) return c.json({ ok: false, error: 'token is required' }, 400);

    try {
      noStore(c);
      const reveal = keystore.consumeRevealRequest(token);
      return c.json({ ok: true, reveal });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 404);
    }
  });

  return app;
}

function noStore(c: { header: (name: string, value: string) => void }) {
  c.header('Cache-Control', 'no-store');
  c.header('Pragma', 'no-cache');
}

async function readBody<T>(c: { req: { json: () => Promise<unknown> } }): Promise<T> {
  try {
    const body = await c.req.json();
    return (body && typeof body === 'object' ? body : {}) as T;
  } catch {
    return {} as T;
  }
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
