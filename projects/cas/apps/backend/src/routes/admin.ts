import {
  type CasJobStatus,
  type CasSafetyConfigPatchRequest,
  type CasSafetyConfigResponse,
  jobToCasDto,
} from '@cfxdevkit/cas-shared';
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

  router.get('/safety', (req: Request, res: Response) => {
    const session = requireAdmin(req, res, state);
    if (!session) return;
    res.json(readSafetyConfig(state));
  });

  router.patch('/safety', (req: Request, res: Response) => {
    const session = requireAdmin(req, res, state);
    if (!session) return;

    const patch = parseSafetyPatch(req.body);
    if ('error' in patch) {
      res.status(400).json({ error: patch.error });
      return;
    }

    if ('maxSwapUsd' in patch.value) state.db.settings.setMaxSwapUsd(patch.value.maxSwapUsd);
    if ('slippageBps' in patch.value) state.db.settings.setSlippageBps(patch.value.slippageBps);
    if ('maxRetries' in patch.value) state.db.settings.setMaxRetries(patch.value.maxRetries);

    res.json(readSafetyConfig(state));
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

function readSafetyConfig(state: CasBackendState): CasSafetyConfigResponse {
  return {
    maxSwapUsd: state.db.settings.getMaxSwapUsd(),
    slippageBps: state.db.settings.getSlippageBps(),
    maxRetries: state.db.settings.getMaxRetries(),
    globalPause: state.db.settings.isPaused(),
  };
}

function parseSafetyPatch(
  body: unknown,
): { value: CasSafetyConfigPatchRequest } | { error: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { error: 'request body must be an object' };
  }

  const input = body as Record<string, unknown>;
  const value: CasSafetyConfigPatchRequest = {};

  if ('maxSwapUsd' in input) {
    if (input.maxSwapUsd !== null && !isNonNegativeNumber(input.maxSwapUsd)) {
      return { error: 'maxSwapUsd must be a non-negative number or null' };
    }
    value.maxSwapUsd = input.maxSwapUsd;
  }

  if ('slippageBps' in input) {
    if (!isIntegerInRange(input.slippageBps, 0, 10_000)) {
      return { error: 'slippageBps must be between 0 and 10000' };
    }
    value.slippageBps = input.slippageBps;
  }

  if ('maxRetries' in input) {
    if (!isIntegerInRange(input.maxRetries, 0, 100)) {
      return { error: 'maxRetries must be between 0 and 100' };
    }
    value.maxRetries = input.maxRetries;
  }

  return { value };
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
