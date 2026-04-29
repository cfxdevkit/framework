import cors from 'cors';
import express, { type Express } from 'express';
import { authRouter } from './auth/router.js';
import { devNodeRouter } from './devnode/router.js';
import { rpcProxyRouter } from './devnode/rpc-proxy.js';
import { sessionKeyRouter } from './session-key/router.js';

export interface CreateAppOptions {
  corsOrigin?: string | string[] | true;
}

/** Build the Express app — exported so tests can mount it without a port. */
export function createApp(opts: CreateAppOptions = {}): Express {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use(
    cors({
      origin: opts.corsOrigin ?? true,
      credentials: false,
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ ok: true, name: '@cfxdevkit/example-showcase-backend' });
  });

  app.use('/auth', authRouter());
  app.use('/session-key', sessionKeyRouter());
  app.use('/devnode', devNodeRouter());
  // CORS-enabled proxy so the browser can speak JSON-RPC to the dev node
  // (xcfx itself returns 405 on OPTIONS preflight). Active only while the
  // dev node is running.
  app.use('/rpc', rpcProxyRouter());

  return app;
}
