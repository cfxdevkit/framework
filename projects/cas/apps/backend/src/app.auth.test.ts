import { createSiweMessage } from '@cfxdevkit/wallet-connect/siwe';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { __poolsTest } from './routes/pools.js';
import { TEST_ACCOUNT, createCasBackendApp, createCasBackendState, makeConfig } from './app.test-helpers.js';

describe('CAS backend – auth', () => {
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
        chainId: 71,
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

  // 4.1 — SIWE success: sign with test PK, assert 200 + JWT
  it('SIWE success: signed message returns 200 and a JWT', async () => {
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
        chainId: 71,
        nonce: nonceRes.body.nonce,
        issuedAt: new Date().toISOString(),
      });
      const signature = await TEST_ACCOUNT.signMessage({ message });

      const verifyRes = await request(app).post('/auth/verify').send({ message, signature });
      expect(verifyRes.status).toBe(200);
      expect(typeof verifyRes.body.token).toBe('string');
      expect(verifyRes.body.token.length).toBeGreaterThan(0);
    } finally {
      state.db.sqlite.close();
    }
  });

  // 4.2 — SIWE chainId mismatch: wrong chainId in SIWE message → 401
  it('SIWE rejects a message with wrong chainId', async () => {
    const config = makeConfig(); // network: 'testnet', expects chainId 71
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
        chainId: 1030, // wrong: mainnet instead of testnet (71)
        nonce: nonceRes.body.nonce,
        issuedAt: new Date().toISOString(),
      });
      const signature = await TEST_ACCOUNT.signMessage({ message });

      const verifyRes = await request(app).post('/auth/verify').send({ message, signature });
      expect(verifyRes.status).toBe(401);
    } finally {
      state.db.sqlite.close();
    }
  });

  // 4.3 — SIWE tampered message: modify message after signing → 401
  it('SIWE rejects a tampered message (signature mismatch)', async () => {
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
        chainId: 71,
        nonce: nonceRes.body.nonce,
        issuedAt: new Date().toISOString(),
      });
      const signature = await TEST_ACCOUNT.signMessage({ message });

      // Tamper: append extra text to the message after signing
      const tamperedMessage = message + '\ntampered';

      const verifyRes = await request(app)
        .post('/auth/verify')
        .send({ message: tamperedMessage, signature });
      expect(verifyRes.status).toBe(401);
    } finally {
      state.db.sqlite.close();
    }
  });
});
