import { Hono } from 'hono';
import { createWalletClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { DevnodeServerController } from '../controller.js';

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

    if (space === 'core') {
      return c.json(
        {
          ok: false,
          error: 'Core Space funding is not yet supported; use the faucet private key directly',
        },
        501,
      );
    }

    try {
      const txHash = await sendEspaceFunds({
        rpc: urls.espace,
        fromPrivateKey: faucet.privateKey as `0x${string}`,
        to: address as `0x${string}`,
        amountCfx: String(body.amount),
      });
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

async function sendEspaceFunds(opts: {
  rpc: string;
  fromPrivateKey: `0x${string}`;
  to: `0x${string}`;
  amountCfx: string;
}): Promise<string> {
  const account = privateKeyToAccount(opts.fromPrivateKey);
  const chain = await fetchChain(opts.rpc);
  const client = createWalletClient({ account, chain, transport: http(opts.rpc) });
  const value = parseUnits(opts.amountCfx, 18);
  const hash = await client.sendTransaction({ to: opts.to, value });
  return hash;
}

async function fetchChain(rpc: string): Promise<{
  id: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: { default: { http: readonly string[] } };
}> {
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
  });
  const json = (await res.json()) as { result: string };
  const id = Number(json.result);
  return {
    id,
    name: 'Conflux eSpace',
    nativeCurrency: { name: 'CFX', symbol: 'CFX', decimals: 18 },
    rpcUrls: { default: { http: [rpc] as const } },
  };
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
