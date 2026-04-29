import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  DevNodeBusyError,
  DevNodeManager,
  DevNodeNotRunningError,
  type DevNodeStatusSnapshot,
} from './manager.js';
import { devNodeRouter } from './router.js';

/** Build a tiny app mounting just the devnode router on a fresh manager. */
function makeApp(manager: DevNodeManager) {
  const app = express();
  app.use(express.json());
  app.use('/devnode', devNodeRouter(manager));
  return app;
}

/** Stub manager that records calls; avoids spawning the real xcfx node. */
class StubManager extends DevNodeManager {
  calls: Array<{ method: string; args?: unknown }> = [];
  private fakeStatus: DevNodeStatusSnapshot = { status: 'stopped', running: false };
  override status(): DevNodeStatusSnapshot {
    this.calls.push({ method: 'status' });
    return this.fakeStatus;
  }
  override async start(req: Parameters<DevNodeManager['start']>[0] = {}) {
    this.calls.push({ method: 'start', args: req });
    this.fakeStatus = { status: 'running', running: true };
    return this.fakeStatus;
  }
  override async stop() {
    this.calls.push({ method: 'stop' });
    if (!this.fakeStatus.running) throw new DevNodeNotRunningError();
    this.fakeStatus = { status: 'stopped', running: false };
    return this.fakeStatus;
  }
  override async restart() {
    this.calls.push({ method: 'restart' });
    if (!this.fakeStatus.running) throw new DevNodeNotRunningError();
    return this.fakeStatus;
  }
  override async wipe() {
    this.calls.push({ method: 'wipe' });
    this.fakeStatus = { status: 'stopped', running: false };
    return this.fakeStatus;
  }
  override async mine(opts: { blocks?: number; pack?: boolean }) {
    this.calls.push({ method: 'mine', args: opts });
    if (!this.fakeStatus.running) throw new DevNodeNotRunningError();
    return this.fakeStatus;
  }
  forceBusyOn(method: string) {
    const original = (this as unknown as Record<string, unknown>)[method] as (
      ...a: unknown[]
    ) => unknown;
    (this as unknown as Record<string, unknown>)[method] = async () => {
      throw new DevNodeBusyError(`${method} is in flight`);
    };
    return () => {
      (this as unknown as Record<string, unknown>)[method] = original;
    };
  }
}

describe('devnode router', () => {
  it('GET /devnode/status returns the manager snapshot', async () => {
    const m = new StubManager();
    const res = await request(makeApp(m)).get('/devnode/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'stopped', running: false });
  });

  it('POST /devnode/start forwards validated config', async () => {
    const m = new StubManager();
    const res = await request(makeApp(m))
      .post('/devnode/start')
      .send({ accounts: 4, miningIntervalMs: 1000, mnemonic: 'm' });
    expect(res.status).toBe(200);
    expect(res.body.running).toBe(true);
    const startCall = m.calls.find((c) => c.method === 'start');
    expect(startCall?.args).toEqual({ accounts: 4, miningIntervalMs: 1000, mnemonic: 'm' });
  });

  it('POST /devnode/start rejects out-of-range accounts', async () => {
    const m = new StubManager();
    const res = await request(makeApp(m)).post('/devnode/start').send({ accounts: 99 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/accounts/);
  });

  it('POST /devnode/start rejects miningIntervalMs < 100 (and != 0)', async () => {
    const m = new StubManager();
    const res = await request(makeApp(m)).post('/devnode/start').send({ miningIntervalMs: 50 });
    expect(res.status).toBe(400);
  });

  it('POST /devnode/stop returns 409 when not running', async () => {
    const m = new StubManager();
    const res = await request(makeApp(m)).post('/devnode/stop');
    expect(res.status).toBe(409);
  });

  it('POST /devnode/wipe is allowed regardless of state', async () => {
    const m = new StubManager();
    const res = await request(makeApp(m)).post('/devnode/wipe');
    expect(res.status).toBe(200);
  });

  it('POST /devnode/mine validates `blocks`', async () => {
    const m = new StubManager();
    await m.start();
    const bad = await request(makeApp(m)).post('/devnode/mine').send({ blocks: -1 });
    expect(bad.status).toBe(400);
    const ok = await request(makeApp(m)).post('/devnode/mine').send({ blocks: 3 });
    expect(ok.status).toBe(200);
    const mineCall = m.calls.find((c) => c.method === 'mine');
    expect(mineCall?.args).toEqual({ blocks: 3, pack: false });
  });

  it('POST /devnode/mine forwards `pack: true`', async () => {
    const m = new StubManager();
    await m.start();
    const res = await request(makeApp(m)).post('/devnode/mine').send({ pack: true });
    expect(res.status).toBe(200);
    expect(m.calls.find((c) => c.method === 'mine')?.args).toEqual({ pack: true });
  });

  it('returns 409 for busy errors and 500 for unknown errors', async () => {
    const m = new StubManager();
    const restoreBusy = m.forceBusyOn('start');
    const busyRes = await request(makeApp(m)).post('/devnode/start').send({});
    expect(busyRes.status).toBe(409);
    restoreBusy();

    // Unknown error -> 500
    (m as unknown as { stop: () => Promise<unknown> }).stop = async () => {
      throw new Error('boom');
    };
    const fiveHundred = await request(makeApp(m)).post('/devnode/stop');
    expect(fiveHundred.status).toBe(500);
    expect(fiveHundred.body.error).toBe('boom');
  });
});
