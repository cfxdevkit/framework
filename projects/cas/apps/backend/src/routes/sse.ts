import type { Request, Response, Router } from 'express';
import express from 'express';
import { handleJobsSse } from '../sse/events.js';
import type { CasBackendState } from '../types.js';

export function createSseRouter(state: CasBackendState): Router {
  const router = express.Router();

  router.get('/jobs', (req: Request, res: Response) => handleJobsSse(req, res, state));

  return router;
}
