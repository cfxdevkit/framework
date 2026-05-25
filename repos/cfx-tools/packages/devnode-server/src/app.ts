import { join, resolve } from 'node:path';
import type {
  DevnodeMineInput,
  DevnodeRestartInput,
  DevnodeStartInput,
  DevnodeWipeInput,
} from '@cfxdevkit/devnode-core';
import {
  type AccountsRoutesOptions,
  ContractRegistry,
  createAccountsRoutes,
  createCompilerRoutes,
  createMiningRoutes,
  createNetworkRoutes,
  DevnodeServerController,
  type DevnodeServerControllerOptions,
  NetworkState,
} from '@cfxdevkit/devnode-core';
import {
  createKeystoreRoutes,
  type KeystoreResetGuidance,
  KeystoreService,
} from '@cfxdevkit/keystore-server';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { NodeProfileService } from './profiles.js';
import { createBootstrapRoutes } from './routes/bootstrap.js';
import { createContractsRoutes } from './routes/contracts.js';
import { createDeployRoutes } from './routes/deploy.js';
import { createNodeProfileRoutes } from './routes/node-profile.js';
import { createSessionKeyRoutes } from './routes/session-key.js';

export interface DevnodeServerAppOptions
  extends DevnodeServerControllerOptions,
    AccountsRoutesOptions {
  controller?: DevnodeServerController;
  contracts?: ContractRegistry;
  extendApp?: (app: Hono, context: DevnodeServerExtensionContext) => void;
  keystore?: KeystoreService;
  keystorePath?: string;
  network?: NetworkState;
  nodeProfileDataRoot?: string;
  profiles?: NodeProfileService;
}

export interface DevnodeServerExtensionContext {
  controller: DevnodeServerController;
  contracts: ContractRegistry;
  keystore: KeystoreService;
  network: NetworkState;
  profiles: NodeProfileService;
}

export function createDevnodeServerApp(options: DevnodeServerAppOptions = {}): Hono {
  const controller = options.controller ?? new DevnodeServerController(options);
  const keystorePath = options.keystorePath ?? '.devnode-keystore.json';
  const keystore = options.keystore ?? new KeystoreService(keystorePath);
  const contracts =
    options.contracts ??
    new ContractRegistry({
      storagePath: join(runtimeStateRootFor(keystorePath), 'contracts.json'),
    });
  const network =
    options.network ??
    new NetworkState({
      storagePath: join(runtimeStateRootFor(keystorePath), 'network-profiles.json'),
    });
  const profiles =
    options.profiles ??
    new NodeProfileService({
      isNodeRunning: () => controller.status().running,
      keystore,
      ...(options.nodeProfileDataRoot ? { dataDirRoot: options.nodeProfileDataRoot } : {}),
    });

  const app = new Hono();
  const reset = createResetGuidance({
    keystorePath,
    ...(options.nodeProfileDataRoot ? { nodeProfileDataRoot: options.nodeProfileDataRoot } : {}),
  });

  const syncRuntimeContext = async () => {
    try {
      const wallet = keystore.listWallets().find((entry) => entry.active);
      await contracts.syncWallet(wallet?.id ?? null);
      await network.syncWallet(wallet?.id ?? null);
    } catch {
      await contracts.syncWallet(null);
      await network.syncWallet(null);
    }
  };

  app.onError((error, context) => {
    if (error instanceof HTTPException) return error.getResponse();
    return context.json({ ok: false, error: error.message }, 500);
  });

  app.use('*', async (_context, next) => {
    await syncRuntimeContext();
    await next();
  });

  app.get('/health', (context) => context.json({ ok: true }));
  app.get('/node/status', (context) => context.json({ ok: true, node: controller.status() }));
  app.post('/node/start', async (context) => {
    if (!network.isLocalMode()) {
      return context.json(
        { ok: false, error: 'local devnode can only start when network mode is local' },
        409,
      );
    }

    const input = await readJson<DevnodeStartInput>(context);
    return context.json({
      ok: true,
      node: await controller.start({
        ...input,
        config: await profiles.resolveNodeConfig(input.config ?? {}),
      }),
    });
  });
  app.post('/node/stop', async (context) =>
    context.json({ ok: true, node: await controller.stop() }),
  );
  app.post('/node/restart', async (context) => {
    if (!network.isLocalMode()) {
      return context.json(
        { ok: false, error: 'local devnode can only restart when network mode is local' },
        409,
      );
    }

    const input = await readJson<DevnodeRestartInput>(context);
    const shouldResolveProfile = Boolean(input.config) || !controller.status().running;

    return context.json({
      ok: true,
      node: await controller.restart(
        shouldResolveProfile
          ? {
              ...input,
              config: await profiles.resolveNodeConfig(input.config ?? {}),
            }
          : input,
      ),
    });
  });
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

  app.route('/node/profile', createNodeProfileRoutes(profiles));
  app.route('/keystore', createKeystoreRoutes(keystore, { reset, network }));
  app.route(
    '/accounts',
    createAccountsRoutes(controller, {
      ...(options.sendCoreFunds ? { sendCoreFunds: options.sendCoreFunds } : {}),
      ...(options.sendEspaceFunds ? { sendEspaceFunds: options.sendEspaceFunds } : {}),
    }),
  );
  app.route('/compiler', createCompilerRoutes());
  app.route('/contracts', createContractsRoutes(contracts, controller, keystore, network));
  app.route('/deploy', createDeployRoutes(controller, keystore, contracts, network));
  app.route(
    '/network',
    createNetworkRoutes(network, { isNodeRunning: () => controller.status().running }),
  );
  app.route('/mining', createMiningRoutes(controller));
  app.route('/bootstrap', createBootstrapRoutes(controller, contracts));
  app.route('/session-key', createSessionKeyRoutes(keystore));

  options.extendApp?.(app, {
    controller,
    contracts,
    keystore,
    network,
    profiles,
  });

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

function runtimeStateRootFor(keystorePath: string): string {
  return resolve(`${keystorePath}.runtime`);
}

function createResetGuidance({
  keystorePath,
  nodeProfileDataRoot,
}: {
  keystorePath: string;
  nodeProfileDataRoot?: string;
}): KeystoreResetGuidance {
  return {
    destructive: true,
    mode: 'cli',
    paths: [
      resolve(keystorePath),
      runtimeStateRootFor(keystorePath),
      ...(nodeProfileDataRoot ? [resolve(nodeProfileDataRoot)] : []),
    ],
    requiresNodeStop: true,
    warning: 'Reset deletes the keystore, wallet-scoped runtime state, and local node profiles.',
  };
}
