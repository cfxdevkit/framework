import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { CompileError, CompileManager } from './manager.js';
import { compileRouter } from './router.js';

function makeApp(manager: CompileManager) {
  const app = express();
  app.use(express.json());
  app.use('/compile', compileRouter(manager));
  return app;
}

class StubManager extends CompileManager {
  override async compileTemplate(req: { templateId: string }) {
    if (req.templateId === 'boom') throw new CompileError('boom', 500);
    return {
      templateId: req.templateId,
      contractName: 'BasicErc20',
      abi: [],
      bytecode: '0xdead',
      deployedBytecode: '0xbeef',
      inputHash: 'abc',
      warnings: [],
      cached: false,
    };
  }
}

describe('compile router', () => {
  it('GET /compile/templates returns the registry', async () => {
    const res = await request(makeApp(new StubManager())).get('/compile/templates');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.templates)).toBe(true);
    // The real registry is used for `templates()` (StubManager doesn't override it).
    expect(res.body.templates.some((t: { id: string }) => t.id === 'basic-erc20')).toBe(true);
  });

  it('POST /compile rejects missing templateId', async () => {
    const res = await request(makeApp(new StubManager())).post('/compile').send({});
    expect(res.status).toBe(400);
  });

  it('POST /compile returns the artifact for a valid template', async () => {
    const res = await request(makeApp(new StubManager()))
      .post('/compile')
      .send({ templateId: 'basic-erc20' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      contractName: 'BasicErc20',
      bytecode: '0xdead',
      deployedBytecode: '0xbeef',
    });
  });

  it('maps CompileError status verbatim', async () => {
    const res = await request(makeApp(new StubManager()))
      .post('/compile')
      .send({ templateId: 'boom' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('boom');
  });
});
