import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createCasBackendApp,
  createCasBackendState,
  makeConfig,
  OTHER_ACCOUNT,
  signIn,
  TEST_ACCOUNT,
} from './app.test-helpers.js';
import { __poolsTest } from './routes/pools.js';

describe('CAS backend – jobs', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    __poolsTest.resetPoolsCache();
  });

  it('creates, lists, cancels, deletes and reads executions for authenticated jobs', async () => {
    const config = makeConfig();
    const state = createCasBackendState(config);
    const { app } = createCasBackendApp({ config, state });

    try {
      const token = await signIn(app);
      const createRes = await request(app)
        .post('/jobs')
        .set('authorization', `Bearer ${token}`)
        .send({
          type: 'limit_order',
          tokenIn: '0x0000000000000000000000000000000000000002',
          tokenOut: '0x0000000000000000000000000000000000000003',
          amountIn: '100',
          minAmountOut: '90',
          targetPrice: '2',
          direction: 'gte',
          onChainJobId: '0xabc',
        });
      expect(createRes.status).toBe(201);
      expect(createRes.body.job.params.amountIn).toBe('100');
      expect(createRes.body.job.onChainJobId).toBe('0xabc');

      const jobId = createRes.body.job.id as string;
      await state.db.executions.create({ jobId, txHash: '0xabc', amountOut: 95n, timestamp: 12 });

      const listRes = await request(app).get('/jobs').set('authorization', `Bearer ${token}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.jobs).toHaveLength(1);

      const executionsRes = await request(app)
        .get(`/jobs/${jobId}/executions`)
        .set('authorization', `Bearer ${token}`);
      expect(executionsRes.status).toBe(200);
      expect(executionsRes.body.executions).toEqual([
        { id: 1, jobId, txHash: '0xabc', timestamp: 12, amountOut: '95' },
      ]);

      const cancelRes = await request(app)
        .post(`/jobs/${jobId}/cancel`)
        .set('authorization', `Bearer ${token}`);
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.job.status).toBe('cancelled');

      const deleteRes = await request(app)
        .delete(`/jobs/${jobId}`)
        .set('authorization', `Bearer ${token}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.job.id).toBe(jobId);

      const listAfterDeleteRes = await request(app)
        .get('/jobs')
        .set('authorization', `Bearer ${token}`);
      expect(listAfterDeleteRes.status).toBe(200);
      expect(listAfterDeleteRes.body.jobs).toEqual([]);
    } finally {
      state.db.sqlite.close();
    }
  });

  it('returns 404 when deleting another owner job', async () => {
    const config = makeConfig();
    const state = createCasBackendState(config);
    const { app } = createCasBackendApp({ config, state });

    try {
      const ownerToken = await signIn(app, TEST_ACCOUNT);
      const otherToken = await signIn(app, OTHER_ACCOUNT);
      const createRes = await request(app)
        .post('/jobs')
        .set('authorization', `Bearer ${ownerToken}`)
        .send({
          type: 'limit_order',
          tokenIn: '0x0000000000000000000000000000000000000002',
          tokenOut: '0x0000000000000000000000000000000000000003',
          amountIn: '100',
          minAmountOut: '90',
          targetPrice: '2',
          direction: 'gte',
        });
      expect(createRes.status).toBe(201);

      const deleteRes = await request(app)
        .delete(`/jobs/${createRes.body.job.id as string}`)
        .set('authorization', `Bearer ${otherToken}`);
      expect(deleteRes.status).toBe(404);
      expect(deleteRes.body.error).toBe('job not found');
    } finally {
      state.db.sqlite.close();
    }
  });
});
