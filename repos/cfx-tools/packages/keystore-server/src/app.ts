import { Hono } from 'hono';
import type { KeystoreResetGuidance, KeystoreService } from './keystore.js';
import { createKeystoreRoutes } from './routes/keystore.js';

export interface KeystoreServerAppOptions {
  keystore: KeystoreService;
  network?: { chainIds(): { core: number } };
  reset?: KeystoreResetGuidance;
}

export function createKeystoreApp(options: KeystoreServerAppOptions): Hono {
  const app = new Hono();
  const routeOptions: {
    reset?: KeystoreResetGuidance;
    network?: { chainIds(): { core: number } };
  } = {};
  if (options.reset !== undefined) routeOptions.reset = options.reset;
  if (options.network !== undefined) routeOptions.network = options.network;
  app.route('/', createKeystoreRoutes(options.keystore, routeOptions));
  return app;
}
