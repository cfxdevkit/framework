import type { DevNode, DevNodeConfig } from '@cfxdevkit/devnode';
import { describe, expect, it } from 'vitest';
import { createDevnodeServerApp, DevnodeServerController } from './index.js';

describe('@cfxdevkit/devnode-server', () => {
  it('returns stopped status before a node is started', async () => {
    const app = createDevnodeServerApp({ createNode: createMockNode });

    const response = await app.request('/node/status');

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      node: { status: 'stopped', running: false, accounts: [] },
    });
  });

  it('starts and mines through the Hono API', async () => {
    const app = createDevnodeServerApp({ createNode: createMockNode });

    const started = await app.request('/node/start', {
      method: 'POST',
      body: JSON.stringify({ config: { accounts: 2, dataDir: '/tmp/cfxdevkit-test' } }),
    });
    await expect(started.json()).resolves.toMatchObject({
      ok: true,
      node: { status: 'running', running: true, config: { accounts: 2 } },
    });

    const mined = await app.request('/node/mine', {
      method: 'POST',
      body: JSON.stringify({ blocks: 3 }),
    });
    await expect(mined.json()).resolves.toMatchObject({
      ok: true,
      node: { mining: { ticks: 3 } },
    });
  });

  it('wipes the active data directory and can restart', async () => {
    const removed: string[] = [];
    const controller = new DevnodeServerController({
      createNode: createMockNode,
      removeDataDir: async (path) => {
        removed.push(path);
      },
    });
    await controller.start({ config: { dataDir: '/tmp/devnode-a' } });

    const status = await controller.wipe({ restart: true });

    expect(removed).toEqual(['/tmp/devnode-a']);
    expect(status).toMatchObject({ status: 'running', running: true });
  });
});

function createMockNode(config: DevNodeConfig = {}): DevNode {
  let status: ReturnType<DevNode['getStatus']> = 'stopped';
  let miningTicks = 0;
  return {
    config: { dataDir: config.dataDir ?? '/tmp/mock-devnode', ...config },
    accounts: Array.from({ length: config.accounts ?? 1 }, (_unused, index) => ({
      index,
      privateKey: `0x${String(index + 1).padStart(64, '0')}`,
      evmAddress: `0x${String(index + 1).padStart(40, '0')}`,
      coreAddress: `cfxtest:mock${index}`,
      initialBalanceCfx: '1000000',
    })),
    faucet: {
      index: 999,
      privateKey: `0x${'f'.repeat(64)}`,
      evmAddress: `0x${'f'.repeat(40)}`,
      coreAddress: 'cfxtest:faucet',
      initialBalanceCfx: '1000000',
    },
    urls: {
      core: 'http://127.0.0.1:12537',
      espace: 'http://127.0.0.1:8545',
      coreWs: 'ws://127.0.0.1:12536',
      espaceWs: 'ws://127.0.0.1:8546',
    },
    getStatus: () => status,
    isRunning: () => status === 'running',
    getMiningStatus: () => ({ enabled: false, intervalMs: 0, ticks: miningTicks }),
    start: async () => {
      status = 'running';
    },
    stop: async () => {
      status = 'stopped';
    },
    restart: async () => {
      status = 'running';
    },
    mine: async (blocks = 1) => {
      miningTicks += blocks;
    },
    packMine: async () => {
      miningTicks += 1;
    },
    startMining: async () => {},
    stopMining: async () => {},
  } as unknown as DevNode;
}
