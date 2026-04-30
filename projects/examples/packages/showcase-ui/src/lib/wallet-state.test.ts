/**
 * wallet-state.test.ts — behaviour matrix for wallet pill state derivation.
 *
 * Each test row is:  [description, inputs…, expectedOutput]
 *
 * This gives a full truth-table of how the UI should respond to every
 * combination of wallet status × chain × network selection, without any
 * browser or React scaffolding.
 */
import { describe, expect, it } from 'vitest';
import {
  coreChainLabel,
  deriveCoreState,
  deriveESpaceState,
  espaceChainLabel,
  needsESpaceSwitch,
} from './wallet-state.js';

// ── Constants ──────────────────────────────────────────────────────────

const CORE_MAINNET_HEX = '0x405';
const CORE_TESTNET_HEX = '0x1';
const CORE_LOCAL_HEX = '0xc9';

const ESPACE_MAINNET = 1030;
const ESPACE_TESTNET = 71;
const ESPACE_LOCAL = 2030;

// ── deriveCoreState ────────────────────────────────────────────────────

describe('deriveCoreState', () => {
  /**
   * Matrix: status × chainId × targetHex → CorePillState
   *
   * Columns: status | chainId | targetHex | isPending | isActive | canConnect | onCorrectChain | showSwitch
   */
  const matrix: [
    label: string,
    status: string,
    chainId: string | undefined,
    targetHex: string,
    expected: {
      isPending: boolean;
      isActive: boolean;
      canConnect: boolean;
      onCorrectChain: boolean;
      showSwitch: boolean;
    },
  ][] = [
    // ── not-installed: extension absent ───────────────────────────────
    [
      'not-installed / no chain / mainnet target',
      'not-installed',
      undefined,
      CORE_MAINNET_HEX,
      {
        isPending: false,
        isActive: false,
        canConnect: false,
        onCorrectChain: true,
        showSwitch: false,
      },
    ],

    // ── in-detecting: brief probe phase on page load ──────────────────
    [
      'in-detecting / no chain / mainnet target',
      'in-detecting',
      undefined,
      CORE_MAINNET_HEX,
      {
        isPending: true,
        isActive: false,
        canConnect: false,
        onCorrectChain: true,
        showSwitch: false,
      },
    ],

    // ── in-activating: popup open, waiting for user approval ──────────
    [
      'in-activating / no chain / mainnet target',
      'in-activating',
      undefined,
      CORE_MAINNET_HEX,
      {
        isPending: true,
        isActive: false,
        canConnect: false,
        onCorrectChain: true,
        showSwitch: false,
      },
    ],

    // ── not-active: installed but user has not connected ───────────────
    [
      'not-active / no chain / mainnet target',
      'not-active',
      undefined,
      CORE_MAINNET_HEX,
      {
        isPending: false,
        isActive: false,
        canConnect: true,
        onCorrectChain: true,
        showSwitch: false,
      },
    ],
    [
      'not-active / no chain / testnet target',
      'not-active',
      undefined,
      CORE_TESTNET_HEX,
      {
        isPending: false,
        isActive: false,
        canConnect: true,
        onCorrectChain: true,
        showSwitch: false,
      },
    ],

    // ── chain-error: connected but unrecognised chain ─────────────────
    [
      'chain-error / no chain / mainnet target',
      'chain-error',
      undefined,
      CORE_MAINNET_HEX,
      {
        isPending: false,
        isActive: false,
        canConnect: true,
        onCorrectChain: true,
        showSwitch: false,
      },
    ],

    // ── active, correct chain ─────────────────────────────────────────
    [
      'active / mainnet chain / mainnet target',
      'active',
      CORE_MAINNET_HEX,
      CORE_MAINNET_HEX,
      {
        isPending: false,
        isActive: true,
        canConnect: false,
        onCorrectChain: true,
        showSwitch: false,
      },
    ],
    [
      'active / testnet chain / testnet target',
      'active',
      CORE_TESTNET_HEX,
      CORE_TESTNET_HEX,
      {
        isPending: false,
        isActive: true,
        canConnect: false,
        onCorrectChain: true,
        showSwitch: false,
      },
    ],
    [
      'active / local chain / local target',
      'active',
      CORE_LOCAL_HEX,
      CORE_LOCAL_HEX,
      {
        isPending: false,
        isActive: true,
        canConnect: false,
        onCorrectChain: true,
        showSwitch: false,
      },
    ],

    // ── active, wrong chain → Switch button must appear ────────────────
    [
      'active / mainnet chain / testnet target → show switch',
      'active',
      CORE_MAINNET_HEX,
      CORE_TESTNET_HEX,
      {
        isPending: false,
        isActive: true,
        canConnect: false,
        onCorrectChain: false,
        showSwitch: true,
      },
    ],
    [
      'active / testnet chain / mainnet target → show switch',
      'active',
      CORE_TESTNET_HEX,
      CORE_MAINNET_HEX,
      {
        isPending: false,
        isActive: true,
        canConnect: false,
        onCorrectChain: false,
        showSwitch: true,
      },
    ],
    [
      'active / local chain / mainnet target → show switch',
      'active',
      CORE_LOCAL_HEX,
      CORE_MAINNET_HEX,
      {
        isPending: false,
        isActive: true,
        canConnect: false,
        onCorrectChain: false,
        showSwitch: true,
      },
    ],
    [
      'active / unknown chain / mainnet target → show switch',
      'active',
      '0xdeadbeef',
      CORE_MAINNET_HEX,
      {
        isPending: false,
        isActive: true,
        canConnect: false,
        onCorrectChain: false,
        showSwitch: true,
      },
    ],

    // ── chainId case-insensitivity ─────────────────────────────────────
    [
      'active / uppercase chainId / mainnet target (case-insensitive match)',
      'active',
      '0X405',
      CORE_MAINNET_HEX,
      {
        isPending: false,
        isActive: true,
        canConnect: false,
        onCorrectChain: true,
        showSwitch: false,
      },
    ],
    [
      'active / mixed-case chainId / testnet target (case-insensitive match)',
      'active',
      '0X1',
      CORE_TESTNET_HEX,
      {
        isPending: false,
        isActive: true,
        canConnect: false,
        onCorrectChain: true,
        showSwitch: false,
      },
    ],
  ];

  for (const [label, status, chainId, targetHex, expected] of matrix) {
    it(label, () => {
      expect(deriveCoreState(status, chainId, targetHex)).toEqual(expected);
    });
  }
});

// ── deriveESpaceState ──────────────────────────────────────────────────

describe('deriveESpaceState', () => {
  /**
   * Matrix: isConnected × chainId × targetChainId → ESpacePillState
   */
  const matrix: [
    label: string,
    isConnected: boolean,
    chainId: number,
    targetChainId: number,
    expected: { isConnected: boolean; onCorrectChain: boolean; showSwitch: boolean },
  ][] = [
    // ── not connected — no mismatch possible ──────────────────────────
    [
      'not connected / mainnet chain / mainnet target',
      false,
      ESPACE_MAINNET,
      ESPACE_MAINNET,
      { isConnected: false, onCorrectChain: true, showSwitch: false },
    ],
    [
      'not connected / mainnet chain / testnet target',
      false,
      ESPACE_MAINNET,
      ESPACE_TESTNET,
      { isConnected: false, onCorrectChain: true, showSwitch: false },
    ],
    [
      'not connected / 0 chain / mainnet target',
      false,
      0,
      ESPACE_MAINNET,
      { isConnected: false, onCorrectChain: true, showSwitch: false },
    ],

    // ── connected, correct chain ──────────────────────────────────────
    [
      'connected / mainnet chain / mainnet target',
      true,
      ESPACE_MAINNET,
      ESPACE_MAINNET,
      { isConnected: true, onCorrectChain: true, showSwitch: false },
    ],
    [
      'connected / testnet chain / testnet target',
      true,
      ESPACE_TESTNET,
      ESPACE_TESTNET,
      { isConnected: true, onCorrectChain: true, showSwitch: false },
    ],
    [
      'connected / local chain / local target',
      true,
      ESPACE_LOCAL,
      ESPACE_LOCAL,
      { isConnected: true, onCorrectChain: true, showSwitch: false },
    ],

    // ── connected, wrong chain → showSwitch ───────────────────────────
    [
      'connected / mainnet chain / testnet target → show switch',
      true,
      ESPACE_MAINNET,
      ESPACE_TESTNET,
      { isConnected: true, onCorrectChain: false, showSwitch: true },
    ],
    [
      'connected / testnet chain / mainnet target → show switch',
      true,
      ESPACE_TESTNET,
      ESPACE_MAINNET,
      { isConnected: true, onCorrectChain: false, showSwitch: true },
    ],
    [
      'connected / local chain / mainnet target → show switch',
      true,
      ESPACE_LOCAL,
      ESPACE_MAINNET,
      { isConnected: true, onCorrectChain: false, showSwitch: true },
    ],
    [
      'connected / unknown chain / mainnet target → show switch',
      true,
      1,
      ESPACE_MAINNET,
      { isConnected: true, onCorrectChain: false, showSwitch: true },
    ],
  ];

  for (const [label, isConnected, chainId, targetChainId, expected] of matrix) {
    it(label, () => {
      expect(deriveESpaceState(isConnected, chainId, targetChainId)).toEqual(expected);
    });
  }
});

// ── needsESpaceSwitch ──────────────────────────────────────────────────

describe('needsESpaceSwitch', () => {
  /**
   * Matrix: isConnected × connectedChainId × targetChainId → boolean
   *
   * This guards WagmiNetworkSync: only fire wallet_switchEthereumChain when
   * there is actually a mismatch.  Do NOT fire when not connected (prevents
   * unnecessary wallet prompts, and prevents Fluent Core from receiving an
   * EVM switch request when no eSpace wallet is connected).
   */
  const matrix: [
    label: string,
    isConnected: boolean,
    connectedChainId: number,
    targetChainId: number,
    shouldSwitch: boolean,
  ][] = [
    // ── not connected → never switch ──────────────────────────────────
    ['not connected / any chains → no switch', false, ESPACE_MAINNET, ESPACE_TESTNET, false],
    ['not connected / same chains → no switch', false, ESPACE_MAINNET, ESPACE_MAINNET, false],
    ['not connected / chain=0 / mainnet target → no switch', false, 0, ESPACE_MAINNET, false],

    // ── connected, already on correct chain → no switch ───────────────
    [
      'connected / mainnet chain / mainnet target → no switch',
      true,
      ESPACE_MAINNET,
      ESPACE_MAINNET,
      false,
    ],
    [
      'connected / testnet chain / testnet target → no switch',
      true,
      ESPACE_TESTNET,
      ESPACE_TESTNET,
      false,
    ],

    // ── connected, wrong chain → switch ───────────────────────────────
    ['connected / mainnet → testnet switch needed', true, ESPACE_MAINNET, ESPACE_TESTNET, true],
    ['connected / testnet → mainnet switch needed', true, ESPACE_TESTNET, ESPACE_MAINNET, true],
    ['connected / local → mainnet switch needed', true, ESPACE_LOCAL, ESPACE_MAINNET, true],
    ['connected / unknown (1) → mainnet switch needed', true, 1, ESPACE_MAINNET, true],
  ];

  for (const [label, isConnected, connectedChainId, targetChainId, expected] of matrix) {
    it(label, () => {
      expect(needsESpaceSwitch(isConnected, connectedChainId, targetChainId)).toBe(expected);
    });
  }
});

// ── Cross-wallet network-change interaction matrix ─────────────────────

describe('network change interaction matrix', () => {
  /**
   * Documents expected UI reactions when the user changes the network selector.
   *
   * This is a logical specification of behaviour — the actual wagmi/Fluent
   * calls are exercised in the components, but the decision table here makes
   * the intent auditable.
   *
   * Scenario columns:
   *   eSpace connected?  ×  Core connected?  ×  new network
   *   → eSpace should switch?  ×  Core should show Switch button?
   */
  const scenarios: [
    label: string,
    espaceConnected: boolean,
    espaceChainId: number,
    coreStatus: string,
    coreChainId: string | undefined,
    newEspaceChainId: number,
    newCoreChainIdHex: string,
    expectESpaceSwitch: boolean,
    expectCoreSwitch: boolean,
  ][] = [
    [
      'neither wallet connected → no switches',
      false,
      0,
      'not-active',
      undefined,
      ESPACE_TESTNET,
      CORE_TESTNET_HEX,
      false,
      false,
    ],
    [
      'only eSpace connected (MetaMask, mainnet) → switch eSpace only',
      true,
      ESPACE_MAINNET,
      'not-active',
      undefined,
      ESPACE_TESTNET,
      CORE_TESTNET_HEX,
      true,
      false,
    ],
    [
      'only eSpace connected, already on target → no switch',
      true,
      ESPACE_TESTNET,
      'not-active',
      undefined,
      ESPACE_TESTNET,
      CORE_TESTNET_HEX,
      false,
      false,
    ],
    [
      'only Core connected (mainnet) → switch Core only',
      false,
      0,
      'active',
      CORE_MAINNET_HEX,
      ESPACE_TESTNET,
      CORE_TESTNET_HEX,
      false,
      true,
    ],
    [
      'only Core connected, already on target → no Core switch',
      false,
      0,
      'active',
      CORE_TESTNET_HEX,
      ESPACE_TESTNET,
      CORE_TESTNET_HEX,
      false,
      false,
    ],
    [
      'both connected (mainnet) → both should switch',
      true,
      ESPACE_MAINNET,
      'active',
      CORE_MAINNET_HEX,
      ESPACE_TESTNET,
      CORE_TESTNET_HEX,
      true,
      true,
    ],
    [
      'both connected, eSpace wrong only → eSpace switches, Core stays',
      true,
      ESPACE_MAINNET,
      'active',
      CORE_TESTNET_HEX,
      ESPACE_TESTNET,
      CORE_TESTNET_HEX,
      true,
      false,
    ],
    [
      'both connected, Core wrong only → Core switches, eSpace stays',
      true,
      ESPACE_TESTNET,
      'active',
      CORE_MAINNET_HEX,
      ESPACE_TESTNET,
      CORE_TESTNET_HEX,
      false,
      true,
    ],
  ];

  for (const [
    label,
    espaceConnected,
    espaceChainId,
    coreStatus,
    coreChainId,
    newEspaceChainId,
    newCoreChainIdHex,
    expectESpaceSwitch,
    expectCoreSwitch,
  ] of scenarios) {
    it(label, () => {
      const espaceSwitch = needsESpaceSwitch(espaceConnected, espaceChainId, newEspaceChainId);
      const { showSwitch: coreSwitch } = deriveCoreState(
        coreStatus,
        coreChainId,
        newCoreChainIdHex,
      );
      expect(espaceSwitch).toBe(expectESpaceSwitch);
      expect(coreSwitch).toBe(expectCoreSwitch);
    });
  }
});

// ── Label helpers ──────────────────────────────────────────────────────

describe('coreChainLabel', () => {
  it('returns mainnet label for 0x405', () => expect(coreChainLabel('0x405')).toBe('Core Mainnet'));
  it('returns testnet label for 0x1', () => expect(coreChainLabel('0x1')).toBe('Core Testnet'));
  it('returns local label for 0xc9', () => expect(coreChainLabel('0xc9')).toBe('Core Local'));
  it('case-insensitive for 0X405', () => expect(coreChainLabel('0X405')).toBe('Core Mainnet'));
  it('returns fallback for unknown chain', () =>
    expect(coreChainLabel('0xabc')).toBe('chain 0xabc'));
  it('returns fallback for undefined', () => expect(coreChainLabel(undefined)).toBe('unknown'));
});

describe('espaceChainLabel', () => {
  it('returns mainnet label for 1030', () => expect(espaceChainLabel(1030)).toBe('eSpace Mainnet'));
  it('returns testnet label for 71', () => expect(espaceChainLabel(71)).toBe('eSpace Testnet'));
  it('returns local label for 2030', () => expect(espaceChainLabel(2030)).toBe('eSpace Local'));
  it('returns fallback for unknown chain', () => expect(espaceChainLabel(999)).toBe('chain 999'));
});
