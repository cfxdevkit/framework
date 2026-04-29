import cors from 'cors';
import express, { type Express } from 'express';
import { authRouter } from './auth/router.js';
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

  return app;
}
