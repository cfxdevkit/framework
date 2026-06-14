import { join, resolve } from 'node:path';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ContractRegistry } from './contracts.js';
import { DevnodeServerController } from './controller.js';
import { NetworkState } from './network.js';
import { type AccountsRoutesOptions, createAccountsRoutes } from './routes/accounts.js';
import { createCompilerRoutes } from './routes/compiler.js';
import { createMiningRoutes } from './routes/mining.js';
import { createNetworkRoutes } from './routes/network.js';
import type { DevnodeServerControllerOptions } from './types.js';

export interface DevnodeCoreAppOptions
  extends DevnodeServerControllerOptions,
    AccountsRoutesOptions {
  controller?: DevnodeServerController;
  contracts?: ContractRegistry;
  network?: NetworkState;
  extendApp?: (app: Hono, context: DevnodeCoreExtensionContext) => void;
}

export interface DevnodeCoreExtensionContext {
  controller: DevnodeServerController;
  contracts: ContractRegistry;
  network: NetworkState;
}

/**
 * Creates a lightweight Hono app exposing node control, compilation, mining,
 * accounts, and network routes — with no keystore or wallet dependencies.
 *
 * Use `@cfxdevkit/devnode-server` (which extends this) when you also need
 * keystore management, session keys, contract deployment, and the full
 * key-management stack.
 *
 * @example
 * ```ts
 * import { serve } from '@hono/node-server';
 * import { createDevnodeCoreApp } from '@cfxdevkit/devnode-core';
 *
 * const app = createDevnodeCoreApp();
 * serve({ fetch: app.fetch, port: 52000 });
 * ```
 */
export function createDevnodeCoreApp(options: DevnodeCoreAppOptions = {}): Hono {
  const controller = options.controller ?? new DevnodeServerController(options);
  const contracts =
    options.contracts ??
    new ContractRegistry({
      storagePath: join(runtimeStateRootFor('.devnode-core.json'), 'contracts.json'),
    });
  const network =
    options.network ??
    new NetworkState({
      storagePath: join(runtimeStateRootFor('.devnode-core.json'), 'network-profiles.json'),
    });

  const app = new Hono();

  app.onError((error, context) => {
    if (error instanceof HTTPException) return error.getResponse();
    return context.json({ ok: false, error: error.message }, 500);
  });

  app.get('/health', (context) => context.json({ ok: true }));
  app.get('/node/status', (context) => context.json({ ok: true, node: controller.status() }));

  const accountsRoutesOptions: AccountsRoutesOptions = {};
  if (options.sendCoreFunds !== undefined) {
    accountsRoutesOptions.sendCoreFunds = options.sendCoreFunds;
  }
  if (options.sendEspaceFunds !== undefined) {
    accountsRoutesOptions.sendEspaceFunds = options.sendEspaceFunds;
  }
  app.route('/accounts', createAccountsRoutes(controller, accountsRoutesOptions));
  app.route('/compiler', createCompilerRoutes());
  app.route('/mining', createMiningRoutes(controller));
  app.route(
    '/network',
    createNetworkRoutes(network, { isNodeRunning: () => controller.status().running }),
  );

  options.extendApp?.(app, { controller, contracts, network });

  return app;
}

function runtimeStateRootFor(keystorePath: string): string {
  return resolve(`${keystorePath}.runtime`);
}
