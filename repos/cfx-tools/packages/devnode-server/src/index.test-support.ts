import type { DevNode, DevNodeConfig } from '@cfxdevkit/devnode';
import { type Mock, vi } from 'vitest';

export const deployContractMock: Mock = vi.fn();
export const readContractMock: Mock = vi.fn();
export const sendWriteMock: Mock = vi.fn();
export const sendCoreFundsMock: Mock = vi.fn();
export const sendEspaceFundsMock: Mock = vi.fn();

export const TEST_MNEMONIC = 'test test test test test test test test test test test junk';
export const SECOND_TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

export function createMockNode(config: DevNodeConfig = {}): DevNode {
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
