import { describe, it, expect } from 'vitest';
import { generateBackendEnv, generateFrontendEnv } from './write-env.js';
import { EMPTY_STATE } from '../wizard.js';
import type { WizardState } from '../wizard.js';

const TESTNET_STATE: WizardState = {
  ...EMPTY_STATE,
  network: 'testnet',
  rpcUrl: 'https://evmtestnet.confluxrpc.com',
  automationManagerAddress: '0x33e5E5B262e5d8eBC443E1c6c9F14215b020554d',
  permitHandlerAddress: '0x4240882f2D9D70Cdb9fBCC859cdD4d3e59f5d137',
  priceAdapterAddress: '0x88C48e0E8F76493Bb926131a2BE779cc17ecBEdF',
  swappiRouterAddress: '0x62B0873055Bf896Dd869e172119871ac24aeA305',
  wcfxAddress: '0x2ED3dddae5B2F321AF0806181FBFA6D049Be47d8',
  keeperEnabled: false,
};

const MAINNET_STATE: WizardState = {
  ...EMPTY_STATE,
  network: 'mainnet',
  rpcUrl: 'https://evm.confluxrpc.com',
  automationManagerAddress: '0x9D5B131e5bA37A238cd1C485E2D9d7c2A68E1d0F',
  permitHandlerAddress: '0x0D566aC9Dd1e20Fc63990bEEf6e8abBA876c896B',
  priceAdapterAddress: '0xD2Cc2a7Eb4A5792cE6383CcD0f789C1A9c48ECf9',
  swappiRouterAddress: '0x62B0873055Bf896Dd869e172119871ac24aeA305',
  wcfxAddress: '0x14b2D3bC65e74DAE1030EAFd8ac30c533c976A9b',
  keeperEnabled: false,
};

describe('generateBackendEnv', () => {
  it('contains testnet contract addresses for testnet state', () => {
    const env = generateBackendEnv(TESTNET_STATE);
    expect(env).toContain('NETWORK=testnet');
    expect(env).toContain('AUTOMATION_MANAGER_ADDRESS=0x33e5E5B262e5d8eBC443E1c6c9F14215b020554d');
    expect(env).toContain('PERMIT_HANDLER_ADDRESS=0x4240882f2D9D70Cdb9fBCC859cdD4d3e59f5d137');
    expect(env).toContain('PRICE_ADAPTER_ADDRESS=0x88C48e0E8F76493Bb926131a2BE779cc17ecBEdF');
    expect(env).toContain('CONFLUX_ESPACE_RPC=https://evmtestnet.confluxrpc.com');
  });

  it('contains mainnet contract addresses for mainnet state', () => {
    const env = generateBackendEnv(MAINNET_STATE);
    expect(env).toContain('NETWORK=mainnet');
    expect(env).toContain('AUTOMATION_MANAGER_ADDRESS=0x9D5B131e5bA37A238cd1C485E2D9d7c2A68E1d0F');
    expect(env).toContain('CONFLUX_ESPACE_RPC=https://evm.confluxrpc.com');
  });

  it('sets KEEPER_ENABLED=false when keeper is disabled', () => {
    const env = generateBackendEnv(TESTNET_STATE);
    expect(env).toContain('KEEPER_ENABLED=false');
    // Should NOT have an active (uncommented) SIGNER_PRIVATE_KEY line
    expect(env).not.toMatch(/^SIGNER_PRIVATE_KEY=/m);
  });

  it('sets KEEPER_ENABLED=true and SIGNER_PRIVATE_KEY when keeper is enabled', () => {
    const keeperState: WizardState = {
      ...TESTNET_STATE,
      keeperEnabled: true,
      signerKey: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    };
    const env = generateBackendEnv(keeperState);
    expect(env).toContain('KEEPER_ENABLED=true');
    expect(env).toContain('SIGNER_PRIVATE_KEY=0xdeadbeef');
  });
});

describe('generateFrontendEnv', () => {
  it('contains testnet values for testnet state', () => {
    const env = generateFrontendEnv(TESTNET_STATE);
    expect(env).toContain('NEXT_PUBLIC_CAS_NETWORK=testnet');
    expect(env).toContain(
      'NEXT_PUBLIC_AUTOMATION_MANAGER_ADDRESS=0x33e5E5B262e5d8eBC443E1c6c9F14215b020554d',
    );
    expect(env).toContain('NEXT_PUBLIC_WCFX_ADDRESS=0x2ED3dddae5B2F321AF0806181FBFA6D049Be47d8');
    expect(env).toContain('NEXT_PUBLIC_CONFLUX_ESPACE_RPC=https://evmtestnet.confluxrpc.com');
  });

  it('contains mainnet values for mainnet state', () => {
    const env = generateFrontendEnv(MAINNET_STATE);
    expect(env).toContain('NEXT_PUBLIC_CAS_NETWORK=mainnet');
    expect(env).toContain('NEXT_PUBLIC_WCFX_ADDRESS=0x14b2D3bC65e74DAE1030EAFd8ac30c533c976A9b');
    expect(env).toContain('NEXT_PUBLIC_CONFLUX_ESPACE_RPC=https://evm.confluxrpc.com');
  });
});
