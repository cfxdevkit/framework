import { Hono } from 'hono';
import { type ContractRecord, type ContractRegistry, detectSpace } from '../contracts.js';

export function createContractsRoutes(registry: ContractRegistry): Hono {
  const app = new Hono();

  app.get('/', (c) => {
    return c.json({ ok: true, contracts: registry.list() });
  });

  app.get('/:id', (c) => {
    const contract = registry.get(c.req.param('id'));
    if (!contract) return c.json({ ok: false, error: 'contract not found' }, 404);
    return c.json({ ok: true, contract });
  });

  app.post('/register', async (c) => {
    const body = await readBody<Partial<ContractRecord>>(c);
    if (!body.address) return c.json({ ok: false, error: 'address is required' }, 400);
    if (!body.name) return c.json({ ok: false, error: 'name is required' }, 400);
    if (!Array.isArray(body.abi)) return c.json({ ok: false, error: 'abi must be an array' }, 400);

    const space = body.space ?? detectSpace(body.address);
    const contract = registry.register({
      name: body.name,
      address: body.address,
      abi: body.abi,
      space,
    });
    return c.json({ ok: true, contract }, 201);
  });

  app.delete('/:id', (c) => {
    const deleted = registry.delete(c.req.param('id'));
    if (!deleted) return c.json({ ok: false, error: 'contract not found' }, 404);
    return c.json({ ok: true });
  });

  app.delete('/', (c) => {
    const cleared = registry.clear();
    return c.json({ ok: true, cleared });
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
