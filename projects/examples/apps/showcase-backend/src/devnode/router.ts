import express, { type Request, type Response, type Router } from 'express';
import {
  DevNodeBusyError,
  type DevNodeManager,
  DevNodeNotRunningError,
  type DevNodeStartRequest,
  devNodeManager,
} from './manager.js';

/** HTTP surface for the in-process {@link DevNodeManager} singleton. */
export function devNodeRouter(manager: DevNodeManager = devNodeManager): Router {
  const r = express.Router();

  r.get('/status', (_req: Request, res: Response) => {
    res.json(manager.status());
  });

  r.post('/start', async (req: Request, res: Response) => {
    const parsed = parseStartBody(req.body);
    if ('error' in parsed) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    try {
      res.json(await manager.start(parsed.value));
    } catch (e) {
      sendError(res, e);
    }
  });

  r.post('/stop', async (_req: Request, res: Response) => {
    try {
      res.json(await manager.stop());
    } catch (e) {
      sendError(res, e);
    }
  });

  r.post('/restart', async (_req: Request, res: Response) => {
    try {
      res.json(await manager.restart());
    } catch (e) {
      sendError(res, e);
    }
  });

  r.post('/wipe', async (_req: Request, res: Response) => {
    try {
      res.json(await manager.wipe());
    } catch (e) {
      sendError(res, e);
    }
  });

  r.post('/mine', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as { blocks?: unknown; pack?: unknown };
    const blocks =
      body.blocks === undefined
        ? undefined
        : typeof body.blocks === 'number' && Number.isInteger(body.blocks) && body.blocks > 0
          ? body.blocks
          : null;
    if (blocks === null) {
      res.status(400).json({ error: 'blocks must be a positive integer' });
      return;
    }
    const pack = body.pack === true;
    try {
      const opts: { blocks?: number; pack?: boolean } = { pack };
      if (blocks !== undefined) opts.blocks = blocks;
      res.json(await manager.mine(opts));
    } catch (e) {
      sendError(res, e);
    }
  });

  return r;
}

function parseStartBody(raw: unknown): { value: DevNodeStartRequest } | { error: string } {
  const body = (raw ?? {}) as Record<string, unknown>;
  const out: DevNodeStartRequest = {};
  if (body.mnemonic !== undefined) {
    if (typeof body.mnemonic !== 'string') return { error: 'mnemonic must be a string' };
    out.mnemonic = body.mnemonic;
  }
  if (body.accounts !== undefined) {
    if (
      typeof body.accounts !== 'number' ||
      !Number.isInteger(body.accounts) ||
      body.accounts < 1 ||
      body.accounts > 50
    ) {
      return { error: 'accounts must be an integer between 1 and 50' };
    }
    out.accounts = body.accounts;
  }
  if (body.miningIntervalMs !== undefined) {
    if (
      typeof body.miningIntervalMs !== 'number' ||
      !Number.isFinite(body.miningIntervalMs) ||
      (body.miningIntervalMs !== 0 && body.miningIntervalMs < 100)
    ) {
      return { error: 'miningIntervalMs must be 0 or >= 100' };
    }
    out.miningIntervalMs = body.miningIntervalMs;
  }
  if (body.logging !== undefined) {
    if (typeof body.logging !== 'boolean') return { error: 'logging must be a boolean' };
    out.logging = body.logging;
  }
  return { value: out };
}

function sendError(res: Response, err: unknown): void {
  if (err instanceof DevNodeBusyError || err instanceof DevNodeNotRunningError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : String(err);
  res.status(500).json({ error: message });
}
