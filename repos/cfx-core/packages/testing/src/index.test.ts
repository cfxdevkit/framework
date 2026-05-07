import { describe, expect, it } from 'vitest';
import {
  __packageName,
  createDeferred,
  createDevNodeFixture,
  createMockClient,
  waitFor,
} from './index.js';

describe('@cfxdevkit/testing', () => {
  it('exposes its package name', () => {
    expect(__packageName).toBe('@cfxdevkit/testing');
  });

  it('creates deferred promises', async () => {
    const deferred = createDeferred<string>();
    deferred.resolve('ok');
    await expect(deferred.promise).resolves.toBe('ok');

    const rejected = createDeferred<string>();
    rejected.reject(new Error('bad'));
    await expect(rejected.promise).rejects.toThrow('bad');
  });

  it('waits for eventually true assertions', async () => {
    let ready = false;
    setTimeout(() => {
      ready = true;
    }, 1);
    await expect(waitFor(() => ready, { intervalMs: 1 })).resolves.toBeUndefined();
  });

  it('fails waitFor after the timeout', async () => {
    await expect(waitFor(() => false, { timeoutMs: 0, intervalMs: 0 })).rejects.toThrow(
      'condition was not met',
    );
  });

  it('creates mock clients', async () => {
    const receipt = { status: 'success' } as never;
    const client = createMockClient({ receipts: new Map([['0x1', receipt]]) });
    await expect(client.request({ method: 'eth_chainId' })).resolves.toBeNull();
    await expect(client.getBlockNumber()).resolves.toBe(0n);
    await expect(client.getBlock()).resolves.toEqual({});
    await expect(client.getBalance('0x1')).resolves.toBe(0n);
    await expect(client.estimateGas({})).resolves.toBe(21_000n);
    await expect(client.getTransactionReceipt('0x1' as never)).resolves.toBe(receipt);
  });

  it('creates Core mock clients and delegates custom requests', async () => {
    const client = createMockClient({
      family: 'core',
      logs: [{ address: 'cfx:test' } as never],
      request: (method) => ({ method }),
    });
    await expect(client.request({ method: 'cfx_getStatus' })).resolves.toEqual({
      method: 'cfx_getStatus',
    });
    if (client.family !== 'core') throw new Error('expected core mock');
    await expect(client.getEpochNumber()).resolves.toBe(0n);
    await expect(client.getStatus()).resolves.toMatchObject({ chainId: 2029 });
    await expect(client.getBalance('cfx:test')).resolves.toBe(0n);
    await expect(client.getTransactionReceipt('0x2' as never)).resolves.toBeNull();
    await expect(client.getTransaction('0x2' as never)).resolves.toBeNull();
    await expect(client.getLogs({})).resolves.toHaveLength(1);
    await expect(client.getSponsorInfo('cfx:test')).resolves.toEqual({});
    await expect(client.getAdmin('cfx:test')).resolves.toBeNull();
  });

  it('creates devnode fixtures without starting them by default', async () => {
    const node = await createDevNodeFixture({ accounts: 1 });
    expect(node.isRunning()).toBe(false);
  });
});
