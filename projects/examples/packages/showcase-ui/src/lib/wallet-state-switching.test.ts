import { describe, expect, it } from 'vitest';
import { deriveCoreState, needsESpaceSwitch } from './wallet-state.js';

const CORE_MAINNET_HEX = '0x405';
const CORE_TESTNET_HEX = '0x1';
const ESPACE_MAINNET = 1030;
const ESPACE_TESTNET = 71;
const ESPACE_LOCAL = 2030;

describe('needsESpaceSwitch', () => {
  const matrix: [
    label: string,
    isConnected: boolean,
    connectedChainId: number,
    targetChainId: number,
    shouldSwitch: boolean,
  ][] = [
    ['not connected / any chains → no switch', false, ESPACE_MAINNET, ESPACE_TESTNET, false],
    ['not connected / same chains → no switch', false, ESPACE_MAINNET, ESPACE_MAINNET, false],
    ['not connected / chain=0 / mainnet target → no switch', false, 0, ESPACE_MAINNET, false],

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

describe('network change interaction matrix', () => {
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
