import { signerFromPrivateKey } from '@cfxdevkit/core/wallet';
import { canonicalAttestationMessage } from '@cfxdevkit/wallet/session-key';
import { SiweMessage } from 'siwe';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { _resetNonces } from './auth/nonces.js';

const TEST_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const TEST_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const;

describe('showcase-backend', () => {
  afterEach(() => {
    _resetNonces();
  });

  it('GET /health returns ok', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('SIWE round trip: nonce -> verify -> me', async () => {
    const app = createApp();
    const nonceRes = await request(app).get(`/auth/nonce?address=${TEST_ADDRESS}`);
    expect(nonceRes.status).toBe(200);
    const { nonce } = nonceRes.body as { nonce: string };

    const signer = signerFromPrivateKey(TEST_PK);
    const siwe = new SiweMessage({
      domain: 'localhost',
      address: TEST_ADDRESS,
      statement: 'showcase test',
      uri: 'http://localhost',
      version: '1',
      chainId: 1030,
      nonce,
      issuedAt: new Date().toISOString(),
    });
    const message = siwe.prepareMessage();
    const signature = await signer.signMessage(message);

    const verifyRes = await request(app)
      .post('/auth/verify')
      .send({ message, signature })
      .set('Content-Type', 'application/json');
    expect(verifyRes.status).toBe(200);
    const { token, address } = verifyRes.body as { token: string; address: string };
    expect(address.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());

    const meRes = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.address.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());
  });

  it('SIWE rejects reused nonce', async () => {
    const app = createApp();
    const { body } = await request(app).get(`/auth/nonce?address=${TEST_ADDRESS}`);
    const signer = signerFromPrivateKey(TEST_PK);
    const siwe = new SiweMessage({
      domain: 'localhost',
      address: TEST_ADDRESS,
      uri: 'http://localhost',
      version: '1',
      chainId: 1030,
      nonce: body.nonce,
      issuedAt: new Date().toISOString(),
    });
    const message = siwe.prepareMessage();
    const signature = await signer.signMessage(message);

    const first = await request(app).post('/auth/verify').send({ message, signature });
    expect(first.status).toBe(200);
    const second = await request(app).post('/auth/verify').send({ message, signature });
    expect(second.status).toBe(401);
  });

  it('Session-key issue + verify round trip', async () => {
    const app = createApp();
    const capability = {
      chains: [1030],
      maxValuePerTx: '1000000000000000000',
      notAfter: Date.now() + 60_000,
    };

    const issued = await request(app)
      .post('/session-key/issue')
      .send({ parentPrivateKey: TEST_PK, capability });
    expect(issued.status).toBe(200);
    const body = issued.body as {
      parent: string;
      session: string;
      attestation: { message: string; signature: string };
    };
    expect(body.parent.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());

    // Recompute message and verify against /session-key/verify.
    const verified = await request(app).post('/session-key/verify').send({
      parent: body.parent,
      session: body.session,
      capability,
      signature: body.attestation.signature,
    });
    expect(verified.status).toBe(200);
    expect(verified.body.valid).toBe(true);
    expect(verified.body.message).toBe(
      canonicalAttestationMessage(body.session as `0x${string}`, body.parent as `0x${string}`, {
        chains: capability.chains,
        maxValuePerTx: BigInt(capability.maxValuePerTx),
        notAfter: capability.notAfter,
      }),
    );
  });

  it('Session-key issue rejects empty capability', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/session-key/issue')
      .send({ parentPrivateKey: TEST_PK, capability: {} });
    expect(res.status).toBe(400);
  });
});
