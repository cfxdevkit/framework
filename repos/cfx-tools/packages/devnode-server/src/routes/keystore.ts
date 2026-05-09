import { Hono } from 'hono';
import type { KeystoreService } from '../keystore.js';

export function createKeystoreRoutes(keystore: KeystoreService): Hono {
  const app = new Hono();

  app.get('/status', async (c) => {
    const s = await keystore.status();
    return c.json({ ok: true, ...s });
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

  app.get('/wallets', (c) => {
    try {
      return c.json({ ok: true, wallets: keystore.listWallets() });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 403);
    }
  });

  app.post('/wallets', async (c) => {
    const { mnemonic, name } = await readBody<{ mnemonic?: string; name?: string }>(c);
    if (!mnemonic || !name) {
      return c.json({ ok: false, error: 'mnemonic and name are required' }, 400);
    }
    try {
      const wallet = await keystore.addWallet(mnemonic, name);
      return c.json({ ok: true, wallet });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 400);
    }
  });

  app.put('/wallets/:id/activate', async (c) => {
    const id = c.req.param('id');
    try {
      await keystore.activateWallet(id);
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

  return app;
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
