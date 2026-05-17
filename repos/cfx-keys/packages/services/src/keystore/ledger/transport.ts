import { KeystoreError } from '@cfxdevkit/core';
import type { LedgerEthAppLike, LedgerTransportLike } from './types.js';

export async function createNodeHidLedgerTransport(): Promise<LedgerTransportLike> {
  const moduleName = ['@ledgerhq', 'hw-transport-node-hid'].join('/');
  const mod = (await import(/* webpackIgnore: true */ /* @vite-ignore */ moduleName)) as {
    default?: { create(): Promise<LedgerTransportLike> };
    create?: () => Promise<LedgerTransportLike>;
  };
  const create = mod.default?.create ?? mod.create;
  if (!create) {
    throw new KeystoreError({
      code: 'services/keystore/ledger/transport-unavailable',
      message: '@ledgerhq/hw-transport-node-hid did not expose create()',
    });
  }
  return create();
}

export async function createLedgerEthApp(
  transport: LedgerTransportLike,
): Promise<LedgerEthAppLike> {
  const moduleName = ['@ledgerhq', 'hw-app-eth'].join('/');
  const mod = (await import(/* webpackIgnore: true */ /* @vite-ignore */ moduleName)) as {
    default?: new (transport: LedgerTransportLike) => LedgerEthAppLike;
  };
  const Eth = mod.default;
  if (!Eth) {
    throw new KeystoreError({
      code: 'services/keystore/ledger/app-unavailable',
      message: '@ledgerhq/hw-app-eth did not expose the Ethereum app constructor',
    });
  }
  return new Eth(transport);
}
