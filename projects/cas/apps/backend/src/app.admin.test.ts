import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { __poolsTest } from './routes/pools.js';
import {
  OTHER_ACCOUNT,
  createCasBackendApp,
  createCasBackendState,
  makeConfig,
  signIn,
} from './app.test-helpers.js';

describe('CAS backend – admin', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    __poolsTest.resetPoolsCache();
  });

  it('allows admins to pause, resume and inspect all jobs', async () => {
    const config = makeConfig();
    const state = createCasBackendState(config);
    const { app } = createCasBackendApp({ config, state });

    try {
      const token = await signIn(app);

      const statusRes = await request(app)
        .get('/admin/status')
        .set('authorization', `Bearer ${token}`);
      expect(statusRes.status).toBe(200);
      expect(statusRes.body.paused).toBe(false);

      const pauseRes = await request(app)
        .post('/admin/pause')
        .set('authorization', `Bearer ${token}`);
      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.paused).toBe(true);

      const resumeRes = await request(app)
        .post('/admin/resume')
        .set('authorization', `Bearer ${token}`);
      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.paused).toBe(false);

      const jobsRes = await request(app).get('/admin/jobs').set('authorization', `Bearer ${token}`);
      expect(jobsRes.status).toBe(200);
      expect(jobsRes.body.jobs).toEqual([]);

      const safetyRes = await request(app)
        .get('/admin/safety')
        .set('authorization', `Bearer ${token}`);
      expect(safetyRes.status).toBe(200);
      expect(safetyRes.body).toEqual({
        maxSwapUsd: null,
        slippageBps: 0,
        maxRetries: 3,
        globalPause: false,
      });

      const patchSafetyRes = await request(app)
        .patch('/admin/safety')
        .set('authorization', `Bearer ${token}`)
        .send({ slippageBps: 75 });
      expect(patchSafetyRes.status).toBe(200);
      expect(patchSafetyRes.body.slippageBps).toBe(75);

      const roundtripSafetyRes = await request(app)
        .get('/admin/safety')
        .set('authorization', `Bearer ${token}`);
      expect(roundtripSafetyRes.body.slippageBps).toBe(75);
    } finally {
      state.db.sqlite.close();
    }
  });

  it('rejects protected and admin-only requests without proper authorization', async () => {
    const config = makeConfig();
    const state = createCasBackendState(config);
    const { app } = createCasBackendApp({ config, state });

    try {
      const missingAuthRes = await request(app).get('/jobs');
      expect(missingAuthRes.status).toBe(401);

      const nonAdminToken = await signIn(app, OTHER_ACCOUNT);
      const pauseRes = await request(app)
        .post('/admin/pause')
        .set('authorization', `Bearer ${nonAdminToken}`);
      expect(pauseRes.status).toBe(403);

      const safetyRes = await request(app)
        .get('/admin/safety')
        .set('authorization', `Bearer ${nonAdminToken}`);
      expect(safetyRes.status).toBe(403);
    } finally {
      state.db.sqlite.close();
    }
  });
});
