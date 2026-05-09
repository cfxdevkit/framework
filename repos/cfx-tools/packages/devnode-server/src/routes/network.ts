import { Hono } from 'hono';
import type { Network, NetworkState } from '../network.js';

export function createNetworkRoutes(state: NetworkState): Hono {
  const app = new Hono();

  app.get('/current', (c) => {
    const config = state.config();
    return c.json({ ok: true, network: state.current(), ...config });
  });

  app.get('/capabilities', (c) => {
    return c.json({ ok: true, capabilities: state.capabilities() });
  });

  app.get('/config', (c) => {
    return c.json({ ok: true, config: state.config() });
  });

  app.post('/config', async (c) => {
    const body = await readBody<{ key?: string; value?: string }>(c);
    if (!body.key || !body.value) {
      return c.json({ ok: false, error: 'key and value are required' }, 400);
    }
    if (body.key !== 'espaceRpc' && body.key !== 'coreRpc') {
      return c.json({ ok: false, error: 'key must be espaceRpc or coreRpc' }, 400);
    }
    state.setConfig(body.key, body.value);
    return c.json({ ok: true });
  });

  app.post('/set', async (c) => {
    const body = await readBody<{ network?: string }>(c);
    if (!body.network) return c.json({ ok: false, error: 'network is required' }, 400);
    if (!isNetwork(body.network)) {
      return c.json({ ok: false, error: 'network must be local, testnet, or mainnet' }, 400);
    }
    state.set(body.network);
    return c.json({ ok: true, network: body.network, ...state.config() });
  });

  return app;
}

function isNetwork(value: string): value is Network {
  return value === 'local' || value === 'testnet' || value === 'mainnet';
}

async function readBody<T>(c: { req: { json: () => Promise<unknown> } }): Promise<T> {
  try {
    const body = await c.req.json();
    return (body && typeof body === 'object' ? body : {}) as T;
  } catch {
    return {} as T;
  }
}
