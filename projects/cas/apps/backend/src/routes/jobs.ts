import { executionToCasDto, jobToCasDto } from '@cfxdevkit/cas-shared';
import type { Request, Response, Router } from 'express';
import express from 'express';
import { publishJobUpdate } from '../sse/events.js';
import type { CasBackendState } from '../types.js';
import {
  JOB_STATUSES,
  JOB_TYPES,
  normalizeOptionalFilter,
  parseCreateJobInput,
  readRouteParam,
} from './job-validators.js';
import { requireSession } from './session.js';

export function createJobsRouter(state: CasBackendState): Router {
  const router = express.Router();

  router.get('/', async (req: Request, res: Response) => {
    const session = requireSession(req, res, state);
    if (!session) return;

    const status = normalizeOptionalFilter(req.query.status, JOB_STATUSES, 'status', res);
    if (status === false) return;
    const type = normalizeOptionalFilter(req.query.type, JOB_TYPES, 'type', res);
    if (type === false) return;

    const jobs = await state.db.jobs.list({
      owner: session.address,
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    });
    res.json({ jobs: jobs.map(jobToCasDto) });
  });

  router.get('/updates', async (req: Request, res: Response) => {
    const session = requireSession(req, res, state);
    if (!session) return;

    const since = Number(req.query.since ?? 0);
    if (!Number.isFinite(since) || since < 0) {
      res.status(400).json({ error: 'since must be a non-negative timestamp' });
      return;
    }

    const jobs = (await state.db.jobs.getUpdatedSince(since)).filter(
      (job) => job.owner.toLowerCase() === session.address,
    );
    res.json({ jobs: jobs.map(jobToCasDto) });
  });

  router.post('/', async (req: Request, res: Response) => {
    const session = requireSession(req, res, state);
    if (!session) return;

    const input = parseCreateJobInput(req.body, session.address);
    if ('error' in input) {
      res.status(400).json({ error: input.error });
      return;
    }

    const job = await state.db.jobs.create(input.value);
    publishJobUpdate(state, job);
    res.status(201).json({ job: jobToCasDto(job) });
  });

  router.get('/:id', async (req: Request, res: Response) => {
    const session = requireSession(req, res, state);
    if (!session) return;

    const id = readRouteParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'job id is required' });
      return;
    }

    const job = await state.db.jobs.get(id);
    if (!job || job.owner.toLowerCase() !== session.address) {
      res.status(404).json({ error: 'job not found' });
      return;
    }
    res.json({ job: jobToCasDto(job) });
  });

  const cancelHandler = async (req: Request, res: Response) => {
    const session = requireSession(req, res, state);
    if (!session) return;

    const id = readRouteParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'job id is required' });
      return;
    }

    const job = await state.db.jobs.cancel(id, session.address);
    if (job === 'forbidden') {
      res.status(403).json({ error: 'job belongs to another owner' });
      return;
    }
    if (!job) {
      res.status(404).json({ error: 'job not found or cannot be cancelled' });
      return;
    }
    publishJobUpdate(state, job);
    res.json({ job: jobToCasDto(job) });
  };

  router.post('/:id/cancel', cancelHandler);
  router.delete('/:id', cancelHandler);

  router.get('/:id/executions', async (req: Request, res: Response) => {
    const session = requireSession(req, res, state);
    if (!session) return;

    const id = readRouteParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'job id is required' });
      return;
    }

    const job = await state.db.jobs.get(id);
    if (!job || job.owner.toLowerCase() !== session.address) {
      res.status(404).json({ error: 'job not found' });
      return;
    }

    const executions = await state.db.executions.listByJob(job.id);
    res.json({ executions: executions.map(executionToCasDto) });
  });

  return router;
}
