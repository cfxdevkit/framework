import { Hono } from 'hono';
import type { NodeProfileService } from '../profiles.js';

export function createNodeProfileRoutes(profiles: NodeProfileService): Hono {
  const app = new Hono();

  app.get('/', async (c) => {
    try {
      return c.json({ ok: true, ...(await profiles.status()) });
    } catch (err) {
      return c.json(
        { error: errMsg(err), locked: false, ok: false, profiles: [], selectedProfile: null },
        500,
      );
    }
  });

  app.put('/:id/select', async (c) => {
    const id = c.req.param('id');

    try {
      return c.json({ ok: true, profile: await profiles.selectProfile(id) });
    } catch (err) {
      const message = errMsg(err);
      return c.json({ ok: false, error: message }, statusForSelectError(message));
    }
  });

  return app;
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function statusForSelectError(message: string): 400 | 404 | 409 {
  if (/running/i.test(message)) return 409;
  if (/not found/i.test(message)) return 404;
  return 400;
}
