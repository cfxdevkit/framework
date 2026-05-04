/**
 * `@cfxdevkit/wallet/hardware/ledger` — Ledger hardware-wallet adapter.
 *
 * This is a thin wallet-facing wrapper over the services Ledger signer so the
 * keystore backend and direct hardware adapter share the same signing path.
 */
import {
  type LedgerEthAppLike,
  type LedgerTransportLike,
  type SignerFromLedgerInput,
  signerFromLedger,
} from '@cfxdevkit/services/keystore-ledger';
import type { HardwareWalletAdapter } from '../types.js';

export {
  createLedgerEthApp,
  createNodeHidLedgerTransport,
  signerFromLedger,
} from '@cfxdevkit/services/keystore-ledger';
export type { LedgerEthAppLike, LedgerTransportLike, SignerFromLedgerInput };

export interface LedgerHardwareAdapterInput extends Omit<SignerFromLedgerInput, 'path'> {
  eth?: LedgerEthAppLike;
  coreTransport?: LedgerTransportLike;
  path?: string;
}

export function createLedgerHardwareAdapter(
  input: LedgerHardwareAdapterInput,
): HardwareWalletAdapter {
  return {
    kind: 'ledger',
    getSigner(path?: string) {
      const resolvedPath = path ?? input.path;
      return signerFromLedger({
        ...input,
        ...(resolvedPath !== undefined ? { path: resolvedPath } : {}),
      });
    },
  };
}
