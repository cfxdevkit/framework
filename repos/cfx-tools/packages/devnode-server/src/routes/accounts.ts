import { Hono } from 'hono';
import type { DevnodeServerController } from '../controller.js';
import { sendCoreFunds, sendEspaceFunds } from './accounts-funding.js';

export function createAccountsRoutes(controller: DevnodeServerController): Hono {
  const app = new Hono();

  app.get('/', (c) => {
    const accounts = controller.accounts().map((a) => ({
      index: a.index,
      evmAddress: a.evmAddress,
      coreAddress: a.coreAddress,
      initialBalanceCfx: a.initialBalanceCfx,
    }));
    return c.json({ ok: true, accounts });
  });

  app.get('/faucet', (c) => {
    const faucet = controller.faucet();
    if (!faucet) return c.json({ ok: false, error: 'dev node is not running' }, 503);
    return c.json({
      ok: true,
      faucet: {
        index: faucet.index,
        evmAddress: faucet.evmAddress,
        coreAddress: faucet.coreAddress,
        initialBalanceCfx: faucet.initialBalanceCfx,
      },
    });
  });

  app.post('/fund', async (c) => {
    const body = await readBody<{ address?: string; amount?: string | number }>(c);
    if (!body.address) return c.json({ ok: false, error: 'address is required' }, 400);
    if (!body.amount) return c.json({ ok: false, error: 'amount is required' }, 400);

    const urls = controller.nodeUrls();
    if (!urls) return c.json({ ok: false, error: 'dev node is not running' }, 503);

    const faucet = controller.faucet();
    if (!faucet) return c.json({ ok: false, error: 'dev node is not running' }, 503);

    const address = body.address;
    const space = detectSpace(address);

    try {
      const txHash =
        space === 'core'
          ? await sendCoreFunds({
              rpc: urls.core,
              fromPrivateKey: faucet.privateKey as `0x${string}`,
              to: address,
              amountCfx: String(body.amount),
            })
          : await sendEspaceFunds({
              rpc: urls.espace,
              fromPrivateKey: faucet.privateKey as `0x${string}`,
              to: address as `0x${string}`,
              amountCfx: String(body.amount),
            });
      await controller.mine({ blocks: 1 });
      return c.json({ ok: true, txHash, space });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 500);
    }
  });

  return app;
}

function detectSpace(address: string): 'core' | 'espace' {
  return address.startsWith('cfx') || address.startsWith('net') ? 'core' : 'espace';
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
