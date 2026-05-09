import { Hono } from 'hono';
import type { DevnodeServerController } from '../controller.js';

export function createMiningRoutes(controller: DevnodeServerController): Hono {
  const app = new Hono();

  app.get('/status', (c) => {
    const status = controller.miningStatus();
    return c.json({ ok: true, ...status });
  });

  app.post('/start', async (c) => {
    const body = await readBody<{ intervalMs?: number }>(c);
    const intervalMs = body.intervalMs ?? 2000;
    if (typeof intervalMs !== 'number' || intervalMs < 100) {
      return c.json({ ok: false, error: 'intervalMs must be a number >= 100' }, 400);
    }
    try {
      await controller.startMining(intervalMs);
      return c.json({ ok: true, ...controller.miningStatus() });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 503);
    }
  });

  app.post('/stop', async (c) => {
    try {
      await controller.stopMining();
      return c.json({ ok: true, ...controller.miningStatus() });
    } catch (err) {
      return c.json({ ok: false, error: errMsg(err) }, 503);
    }
  });

  return app;
}

async function readBody<T>(c: { req: { json: () => Promise<unknown> } }): Promise<T> {
  try {
    const body = await c.req.json();
    return (body && typeof body === 'object' ? body : {}) as T;
  } catch {
    return {} as T;
  }
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
