import { Hono } from 'hono';
import type { Network, NetworkState, PersistedNetworkConfigKey } from '../network.js';

export function createNetworkRoutes(
  state: NetworkState,
  options: { isNodeRunning?: () => boolean } = {},
): Hono {
  const app = new Hono();

  app.get('/current', (c) => {
    const profile = state.profile();
    return c.json({ ok: true, ...profile, ...profile.config });
  });

  app.get('/capabilities', (c) => {
    return c.json({ ok: true, mode: state.mode(), capabilities: state.capabilities() });
  });

  app.get('/config', (c) => {
    return c.json({ ok: true, config: state.config(), chainIds: state.chainIds() });
  });

  app.post('/config', async (c) => {
    const body = await readBody<{ key?: string; value?: number | string }>(c);
    if (!body.key || !body.value) {
      return c.json({ ok: false, error: 'key and value are required' }, 400);
    }
    if (!isConfigKey(body.key)) {
      return c.json(
        { ok: false, error: 'key must be espaceRpc, coreRpc, espaceChainId, or coreChainId' },
        400,
      );
    }
    if (
      (body.key === 'coreChainId' || body.key === 'espaceChainId') &&
      !isPositiveInteger(body.value)
    ) {
      return c.json({ ok: false, error: `${body.key} must be a positive integer` }, 400);
    }

    await state.setConfig(body.key, body.value);
    return c.json({ ok: true, config: state.config(), chainIds: state.chainIds() });
  });

  app.post('/set', async (c) => {
    const body = await readBody<{ network?: string }>(c);
    if (!body.network) return c.json({ ok: false, error: 'network is required' }, 400);
    if (!isNetwork(body.network)) {
      return c.json({ ok: false, error: 'network must be local, testnet, or mainnet' }, 400);
    }
    if (body.network !== 'local' && options.isNodeRunning?.()) {
      return c.json(
        { ok: false, error: 'stop the local devnode before switching to a public network' },
        409,
      );
    }

    const profile = await state.set(body.network);
    return c.json({ ok: true, ...profile, ...profile.config });
  });

  return app;
}

function isNetwork(value: string): value is Network {
  return value === 'local' || value === 'testnet' || value === 'mainnet';
}

function isConfigKey(value: string): value is PersistedNetworkConfigKey {
  return (
    value === 'coreRpc' ||
    value === 'espaceRpc' ||
    value === 'coreChainId' ||
    value === 'espaceChainId'
  );
}

function isPositiveInteger(value: number | string): boolean {
  if (typeof value === 'number') return Number.isInteger(value) && value > 0;
  return /^\d+$/.test(value.trim()) && Number(value) > 0;
}

async function readBody<T>(c: { req: { json: () => Promise<unknown> } }): Promise<T> {
  try {
    const body = await c.req.json();
    return (body && typeof body === 'object' ? body : {}) as T;
  } catch {
    return {} as T;
  }
}
