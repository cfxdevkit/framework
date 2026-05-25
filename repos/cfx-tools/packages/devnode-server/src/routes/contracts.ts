import type {
  ContractRegistry,
  DevnodeServerController,
  NetworkState,
} from '@cfxdevkit/devnode-core';
import type { KeystoreService } from '@cfxdevkit/keystore-server';
import { Hono } from 'hono';
import { attachContractActionRoutes } from './contracts-actions.js';
import { normalizeChainId, normalizeNetwork, normalizeSpace } from './contracts-helpers.js';

export function createContractsRoutes(
  registry: ContractRegistry,
  controller: DevnodeServerController,
  keystore: KeystoreService,
  networkState: NetworkState,
): Hono {
  const app = new Hono();

  app.get('/', (c) => {
    const url = new URL(c.req.url);
    const network = normalizeNetwork(url.searchParams.get('network'));
    const space = normalizeSpace(url.searchParams.get('space'));
    const chainId = normalizeChainId(url.searchParams.get('chainId'));

    return c.json({
      ok: true,
      contracts: registry.list({
        ...(network === undefined ? {} : { network }),
        ...(space === undefined ? {} : { space }),
        ...(chainId === undefined ? {} : { chainId }),
      }),
    });
  });

  app.get('/:id', (c) => {
    const contract = registry.get(c.req.param('id'));
    if (!contract) return c.json({ ok: false, error: 'contract not found' }, 404);
    return c.json({ ok: true, contract });
  });
  attachContractActionRoutes(app, { controller, keystore, networkState, registry });

  app.delete('/:id', async (c) => {
    const deleted = await registry.delete(c.req.param('id'));
    if (!deleted) return c.json({ ok: false, error: 'contract not found' }, 404);
    return c.json({ ok: true });
  });

  app.delete('/', async (c) => {
    const cleared = await registry.clear();
    return c.json({ ok: true, cleared });
  });

  return app;
}
