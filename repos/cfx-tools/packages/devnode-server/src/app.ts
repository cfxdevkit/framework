import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ContractRegistry } from './contracts.js';
import { DevnodeServerController } from './controller.js';
import { KeystoreService } from './keystore.js';
import { NetworkState } from './network.js';
import { createAccountsRoutes } from './routes/accounts.js';
import { createBootstrapRoutes } from './routes/bootstrap.js';
import { createContractsRoutes } from './routes/contracts.js';
import { createKeystoreRoutes } from './routes/keystore.js';
import { createMiningRoutes } from './routes/mining.js';
import { createNetworkRoutes } from './routes/network.js';
import type {
  DevnodeMineInput,
  DevnodeRestartInput,
  DevnodeServerControllerOptions,
  DevnodeStartInput,
  DevnodeWipeInput,
} from './types.js';

export interface DevnodeServerAppOptions extends DevnodeServerControllerOptions {
  controller?: DevnodeServerController;
  keystorePath?: string;
}

export function createDevnodeServerApp(options: DevnodeServerAppOptions = {}): Hono {
  const controller = options.controller ?? new DevnodeServerController(options);
  const keystore = new KeystoreService(options.keystorePath ?? '.devnode-keystore.json');
  const contracts = new ContractRegistry();
  const network = new NetworkState();

  const app = new Hono();

  app.onError((error, context) => {
    if (error instanceof HTTPException) return error.getResponse();
    return context.json({ ok: false, error: error.message }, 500);
  });

  app.get('/health', (context) => context.json({ ok: true }));
  app.get('/node/status', (context) => context.json({ ok: true, node: controller.status() }));
  app.post('/node/start', async (context) =>
    context.json({
      ok: true,
      node: await controller.start(await readJson<DevnodeStartInput>(context)),
    }),
  );
  app.post('/node/stop', async (context) =>
    context.json({ ok: true, node: await controller.stop() }),
  );
  app.post('/node/restart', async (context) =>
    context.json({
      ok: true,
      node: await controller.restart(await readJson<DevnodeRestartInput>(context)),
    }),
  );
  app.post('/node/wipe', async (context) =>
    context.json({
      ok: true,
      node: await controller.wipe(await readJson<DevnodeWipeInput>(context)),
    }),
  );
  app.post('/node/mine', async (context) =>
    context.json({
      ok: true,
      node: await controller.mine(await readJson<DevnodeMineInput>(context)),
    }),
  );

  app.route('/keystore', createKeystoreRoutes(keystore));
  app.route('/accounts', createAccountsRoutes(controller));
  app.route('/contracts', createContractsRoutes(contracts));
  app.route('/network', createNetworkRoutes(network));
  app.route('/mining', createMiningRoutes(controller));
  app.route('/bootstrap', createBootstrapRoutes(controller, contracts));

  return app;
}

async function readJson<T>(context: { req: { json: () => Promise<unknown> } }): Promise<T> {
  try {
    const body = await context.req.json();
    return (body && typeof body === 'object' ? body : {}) as T;
  } catch {
    return {} as T;
  }
}
