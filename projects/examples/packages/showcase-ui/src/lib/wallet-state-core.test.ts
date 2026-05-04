import { describe, expect, it } from 'vitest';
import { deriveCoreState } from './wallet-state.js';

const CORE_MAINNET_HEX = '0x405';
const CORE_TESTNET_HEX = '0x1';
const CORE_LOCAL_HEX = '0xc9';

describe('deriveCoreState', () => {
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
