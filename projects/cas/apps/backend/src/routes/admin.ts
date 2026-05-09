import { type CasJobStatus, jobToCasDto } from '@cfxdevkit/cas-shared';
import type { Request, Response, Router } from 'express';
import express from 'express';
import type { CasBackendState } from '../types.js';
import { requireAdmin, requireSession } from './session.js';

const JOB_STATUSES: ReadonlySet<CasJobStatus> = new Set([
  'pending',
  'active',
  'executed',
  'cancelled',
  'failed',
  'expired',
  'paused',
]);

export function createAdminRouter(state: CasBackendState): Router {
  const router = express.Router();

  router.get('/status', (req: Request, res: Response) => {
    const session = requireSession(req, res, state);
    if (!session) return;
    res.json({ paused: state.db.settings.isPaused() });
  });

  router.post('/pause', (req: Request, res: Response) => {
    const session = requireAdmin(req, res, state);
    if (!session) return;
    res.json({ paused: state.db.settings.pause() });
  });

  router.post('/resume', (req: Request, res: Response) => {
    const session = requireAdmin(req, res, state);
    if (!session) return;
    res.json({ paused: state.db.settings.resume() });
  });

  router.get('/jobs', async (req: Request, res: Response) => {
    const session = requireAdmin(req, res, state);
    if (!session) return;

    const status = req.query.status;
    if (
      status !== undefined &&
      (typeof status !== 'string' || !JOB_STATUSES.has(status as CasJobStatus))
    ) {
      res.status(400).json({ error: 'status is not supported' });
      return;
    }

    const jobs = await state.db.jobs.list(status ? { status: status as CasJobStatus } : {});
    res.json({ jobs: jobs.map(jobToCasDto), ...(status ? { status } : {}) });
  });

  return router;
}
