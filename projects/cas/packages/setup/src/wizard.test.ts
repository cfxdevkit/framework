import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_STATE, type WizardState } from './wizard.js';

describe('runWizard orchestrator', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('calls each phase in order and accumulates state', async () => {
    const callOrder: string[] = [];

    const makePhase =
      (name: string, patch: Partial<WizardState>) =>
      async (s: WizardState): Promise<WizardState> => {
        callOrder.push(name);
        return { ...s, ...patch };
      };

    const mockCheckEnv = makePhase('checkEnv', {});
    const mockSelectNetwork = makePhase('selectNetwork', {
      network: 'testnet',
      rpcUrl: 'https://evmtestnet.confluxrpc.com',
    });
    const mockContractMode = makePhase('contractMode', { automationManagerAddress: '0xAM' });
    const mockConfigureKeeper = makePhase('configureKeeper', { keeperEnabled: false });
    const mockWriteEnv = makePhase('writeEnv', {});
    const mockLaunch = makePhase('launch', {});

    vi.doMock('./steps/check/env.js', () => ({ checkEnv: mockCheckEnv }));
    vi.doMock('./steps/select-network.js', () => ({ selectNetwork: mockSelectNetwork }));
    vi.doMock('./steps/contract-mode.js', () => ({ contractMode: mockContractMode }));
    vi.doMock('./steps/configure-keeper.js', () => ({ configureKeeper: mockConfigureKeeper }));
    vi.doMock('./steps/write/env.js', () => ({ writeEnv: mockWriteEnv }));
    vi.doMock('./steps/launch.js', () => ({ launch: mockLaunch }));

    const { runWizard: runWizardMocked } = await import('./wizard.js');
    const initialState: WizardState = { ...EMPTY_STATE };
    await runWizardMocked(initialState);

    expect(callOrder).toEqual([
      'checkEnv',
      'selectNetwork',
      'contractMode',
      'configureKeeper',
      'writeEnv',
      'launch',
    ]);
  });

  it('propagates state from one phase to the next', async () => {
    const receivedStates: WizardState[] = [];

    vi.doMock('./steps/check/env.js', () => ({
      checkEnv: async (s: WizardState) => ({ ...s, rpcUrl: 'https://evmtestnet.confluxrpc.com' }),
    }));
    vi.doMock('./steps/select-network.js', () => ({
      selectNetwork: async (s: WizardState) => {
        receivedStates.push(s);
        return { ...s, network: 'testnet' as const };
      },
    }));
    vi.doMock('./steps/contract-mode.js', () => ({ contractMode: async (s: WizardState) => s }));
    vi.doMock('./steps/configure-keeper.js', () => ({
      configureKeeper: async (s: WizardState) => s,
    }));
    vi.doMock('./steps/write/env.js', () => ({ writeEnv: async (s: WizardState) => s }));
    vi.doMock('./steps/launch.js', () => ({ launch: async (s: WizardState) => s }));

    const { runWizard: runWizardMocked } = await import('./wizard.js');
    await runWizardMocked({ ...EMPTY_STATE });

    // selectNetwork received the state updated by checkEnv
    expect(receivedStates[0]?.rpcUrl).toBe('https://evmtestnet.confluxrpc.com');
  });
});
