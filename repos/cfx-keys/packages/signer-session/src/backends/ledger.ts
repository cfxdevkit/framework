import { createLedgerHardwareAdapter } from '@cfxdevkit/wallet/hardware/ledger';
import type { LedgerSignerInput, SignerSession } from '../types.js';

export async function createLedgerSignerSession(input: LedgerSignerInput): Promise<SignerSession> {
  const espaceChainId = input.espaceChainId ?? 1030;
  const coreNetworkId = input.coreNetworkId ?? 1029;

  const [eSpace, core] = await Promise.all([
    createLedgerHardwareAdapter({
      family: 'espace',
      coreTransport: input.transport,
      chainId: espaceChainId,
      showAddressOnDevice: false,
    }).getSigner(),
    createLedgerHardwareAdapter({
      family: 'core',
      coreTransport: input.transport,
      chainId: coreNetworkId,
      coreNetworkId,
      showAddressOnDevice: false,
    }).getSigner(),
  ]);

  return {
    kind: 'ledger',
    label: `ledger:${eSpace.account.address.slice(0, 10)}…`,
    eSpace,
    core,
    dispose: async () => {
      await (input.transport as { close?: () => Promise<void> }).close?.();
    },
  };
}
