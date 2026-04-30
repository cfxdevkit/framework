import express, { type Request, type Response, type Router } from 'express';
import { CompileError, type CompileManager, compileManager } from './manager.js';

/** HTTP surface for the {@link CompileManager} singleton. */
export function compileRouter(manager: CompileManager = compileManager): Router {
  const r = express.Router();

  r.get('/templates', (_req: Request, res: Response) => {
    // Templates ship their full Solidity source inline so the showcase's
    // in-browser editor can load it without a separate request.
    res.json({ templates: manager.templates() });
  });

  r.get('/catalog', async (_req: Request, res: Response) => {
    try {
      const entries = await manager.catalog();
      res.json({ entries });
    } catch (e) {
      const status = e instanceof CompileError ? e.status : 500;
      const message = e instanceof Error ? e.message : String(e);
      res.status(status).json({ error: message });
    }
  });

  r.post('/sources', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    try {
      const out = await manager.compileSources({
        sources: body.sources as { path: string; content: string }[],
        contractName: body.contractName as string,
        solcVersion: body.solcVersion as string,
        evmVersion: body.evmVersion as string | undefined,
      });
      res.json(out);
    } catch (e) {
      const status = e instanceof CompileError ? e.status : 500;
      const message = e instanceof Error ? e.message : String(e);
      res.status(status).json({ error: message });
    }
  });

  r.post('/', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (typeof body.templateId !== 'string' || body.templateId.length === 0) {
      res.status(400).json({ error: 'templateId must be a non-empty string' });
      return;
    }
    try {
      const out = await manager.compileTemplate({ templateId: body.templateId });
      res.json(out);
    } catch (e) {
      if (e instanceof CompileError) {
        res.status(e.status).json({ error: e.message });
        return;
      }
      const message = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: message });
    }
  });

  return r;
}
