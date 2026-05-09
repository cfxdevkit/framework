import { createSiweMessage } from '@cfxdevkit/wallet-connect/siwe';
import request from 'supertest';
import { privateKeyToAccount } from 'viem/accounts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCasBackendApp, createCasBackendState } from './app.js';
import type { CasBackendConfig } from './config.js';
import { __poolsTest } from './routes/pools.js';

const TEST_ACCOUNT = privateKeyToAccount(
  '0x59c6995e998f97a5a0044966f094538c5fbd3f0d9cb7d0b3a7e3c5f5d8f7aa11',
);

function makeConfig(): CasBackendConfig {
  return {
    port: 0,
    host: '127.0.0.1',
    sqlitePath: ':memory:',
    authSecret: 'test-secret',
    corsOrigins: [],
    network: 'testnet',
    rpcUrl: 'http://127.0.0.1:9',
    automationManagerAddress: '0x0000000000000000000000000000000000000000',
    priceAdapterAddress: '0x0000000000000000000000000000000000000000',
    permitHandlerAddress: '0x0000000000000000000000000000000000000000',
    adminAddresses: [TEST_ACCOUNT.address.toLowerCase()],
    poolsCacheTtlMs: 30 * 60 * 1000,
    sessionTtlMs: 24 * 60 * 60 * 1000,
    nonceTtlMs: 5 * 60 * 1000,
  };
}

describe('CAS backend app', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    __poolsTest.resetPoolsCache();
  });

  it('reports health and sqlite runtime details', async () => {
    const { app, state } = createCasBackendApp({ config: makeConfig() });
    try {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.storage.kind).toBe('sqlite');
      expect(response.body.auth.nonceStore).toBe('sqlite');
    } finally {
      state.db.sqlite.close();
    }
  });

  it('completes a SIWE auth round-trip and rejects nonce reuse', async () => {
    const config = makeConfig();
    const state = createCasBackendState(config);
    const { app } = createCasBackendApp({ config, state });

    try {
      const nonceRes = await request(app).get(`/auth/nonce?address=${TEST_ACCOUNT.address}`);
      expect(nonceRes.status).toBe(200);

      const message = createSiweMessage({
        domain: 'localhost:3000',
        address: TEST_ACCOUNT.address,
        statement: 'Sign in to CAS local dev.',
        uri: 'http://localhost:3000',
        chainId: 2030,
        nonce: nonceRes.body.nonce,
        issuedAt: new Date('2026-05-08T00:00:00.000Z').toISOString(),
      });
      const signature = await TEST_ACCOUNT.signMessage({ message });

      const verifyRes = await request(app).post('/auth/verify').send({ message, signature });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.address).toBe(TEST_ACCOUNT.address.toLowerCase());
      expect(verifyRes.body.isAdmin).toBe(true);

      const meRes = await request(app)
        .get('/auth/me')
        .set('authorization', `Bearer ${verifyRes.body.token as string}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.address).toBe(TEST_ACCOUNT.address.toLowerCase());
      expect(meRes.body.isAdmin).toBe(true);

      const replayRes = await request(app).post('/auth/verify').send({ message, signature });
      expect(replayRes.status).toBe(401);
      expect(replayRes.body.error).toBe('nonce not found, used or expired');
    } finally {
      state.db.sqlite.close();
    }
  });

  it('creates, lists, cancels and reads executions for authenticated jobs', async () => {
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
        .delete(`/jobs/${jobId}`)
        .set('authorization', `Bearer ${token}`);
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.job.status).toBe('cancelled');
    } finally {
      state.db.sqlite.close();
    }
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
    } finally {
      state.db.sqlite.close();
    }
  });

  it('reports pools and system status surfaces', async () => {
    const config = makeConfig();
    const state = createCasBackendState(config);
    const { app } = createCasBackendApp({ config, state });

    try {
      const poolsRes = await request(app).get('/pools');
      expect(poolsRes.status).toBe(200);
      expect(poolsRes.body.tokens).toEqual([]);
      expect(poolsRes.body.pairs).toEqual([]);

      const systemRes = await request(app).get('/system/status');
      expect(systemRes.status).toBe(200);
      expect(systemRes.body.backend.ok).toBe(true);
      expect(systemRes.body.database.ok).toBe(true);
      expect(systemRes.body.worker.status).toBe('unknown');
    } finally {
      state.db.sqlite.close();
    }
  });

  it('loads mainnet pools from GeckoTerminal', async () => {
    const config = { ...makeConfig(), network: 'mainnet' as const };
    const state = createCasBackendState(config);
    const { app } = createCasBackendApp({ config, state });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          data: [
            {
              attributes: { address: '0x00000000000000000000000000000000000000aa' },
              relationships: {
                base_token: { data: { id: 'cfx_0x0000000000000000000000000000000000000001' } },
                quote_token: { data: { id: 'cfx_0x0000000000000000000000000000000000000002' } },
              },
            },
          ],
          included: [
            {
              type: 'token',
              attributes: {
                address: '0x0000000000000000000000000000000000000001',
                symbol: 'CFX',
                name: 'Conflux',
                decimals: 18,
                image_url: 'https://example.test/cfx.png',
              },
            },
            {
              type: 'token',
              attributes: {
                address: '0x0000000000000000000000000000000000000002',
                symbol: 'WCFX',
                name: 'Wrapped CFX',
                decimals: null,
              },
            },
          ],
        }),
      ),
    );

    try {
      const poolsRes = await request(app).get('/pools');
      expect(poolsRes.status).toBe(200);
      expect(poolsRes.body.tokens).toEqual([
        {
          address: '0x0000000000000000000000000000000000000001',
          symbol: 'CFX',
          name: 'Conflux',
          decimals: 18,
          logoURI: 'https://example.test/cfx.png',
        },
        {
          address: '0x0000000000000000000000000000000000000002',
          symbol: 'WCFX',
          name: 'Wrapped CFX',
          decimals: null,
        },
      ]);
      expect(poolsRes.body.pairs).toEqual([
        {
          address: '0x00000000000000000000000000000000000000aa',
          token0: '0x0000000000000000000000000000000000000001',
          token1: '0x0000000000000000000000000000000000000002',
        },
      ]);
    } finally {
      state.db.sqlite.close();
    }
  });
});

async function signIn(app: ReturnType<typeof createCasBackendApp>['app']): Promise<string> {
  const nonceRes = await request(app).get(`/auth/nonce?address=${TEST_ACCOUNT.address}`);
  const message = createSiweMessage({
    domain: 'localhost:3000',
    address: TEST_ACCOUNT.address,
    statement: 'Sign in to CAS local dev.',
    uri: 'http://localhost:3000',
    chainId: 2030,
    nonce: nonceRes.body.nonce,
    issuedAt: new Date('2026-05-08T00:00:00.000Z').toISOString(),
  });
  const signature = await TEST_ACCOUNT.signMessage({ message });
  const verifyRes = await request(app).post('/auth/verify').send({ message, signature });
  return verifyRes.body.token as string;
}
