import type { Router } from 'express';
import express from 'express';
import type { CasBackendState } from '../types.js';

export function createHealthRouter(state: CasBackendState): Router {
  const router = express.Router();

  router.get('/', (_req, res) => {
    res.json({
      ok: true,
      backend: 'cas',
      storage: {
        kind: 'sqlite',
        path: state.db.dbPath,
      },
      auth: {
        nonceStore: 'sqlite',
        sessionMode: 'hmac',
      },
    });
  });

  return router;
}
