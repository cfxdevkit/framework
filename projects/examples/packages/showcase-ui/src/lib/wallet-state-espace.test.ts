import { describe, expect, it } from 'vitest';
import { deriveESpaceState } from './wallet-state.js';

const ESPACE_MAINNET = 1030;
const ESPACE_TESTNET = 71;
const ESPACE_LOCAL = 2030;

describe('deriveESpaceState', () => {
  const matrix: [
    label: string,
    isConnected: boolean,
    chainId: number,
    targetChainId: number,
    expected: { isConnected: boolean; onCorrectChain: boolean; showSwitch: boolean },
  ][] = [
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
