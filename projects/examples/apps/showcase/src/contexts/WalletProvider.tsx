import type { Signer } from '@cfxdevkit/core';
import { createContext, type ReactNode, useContext, useMemo } from 'react';
import {
  DEFAULT_SHOWCASE_MNEMONIC,
  type ShowcaseAccount,
  useKeystoreSession,
} from './KeystoreSessionProvider.js';

export const TEST_MNEMONIC = DEFAULT_SHOWCASE_MNEMONIC;

/**
 * Local account shape — matches `@cfxdevkit/core`'s `DualAddressAccount` field
 * names but is built from a **single** secp256k1 key (the EVM BIP-44 path
 * `m/44'/60'/0'/0/i`) re-encoded as Core base32. This mirrors the convention
 * used by `@cfxdevkit/devnode` (see `node.ts#makeAccount`): xcfx funds the
 * same key on both spaces, so `coreAddress` here is guaranteed to be the
 * address that received the genesis allocation. Using
 * `core.deriveDualAccounts` instead would derive Core from slip-44 503 and
 * Ethereum from slip-44 60 \u2014 two different keys \u2014 which is the
 * correct convention for *production* wallets but breaks the showcase's
 * one-click "use a funded local account" flow.
 */
export interface WalletState {
  /** The pool of accounts derived from the active mnemonic. */
  accounts: ShowcaseAccount[];
  /** Which account index is "connected". `null` when disconnected. */
  activeIndex: number | null;
  active: ShowcaseAccount | null;
  signer: Signer | null;
  mnemonic: string;
  setMnemonic: (m: string) => void;
  connect: (index: number) => void;
  disconnect: () => void;
  rederive: (count: number) => void;
}

const Ctx = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const session = useKeystoreSession();

  const value = useMemo<WalletState>(
    () => ({
      accounts: [...session.accounts],
      activeIndex: session.activeIndex,
      active: session.active,
      signer: session.activeSigner as Signer | null,
      mnemonic: session.mnemonic,
      setMnemonic: session.setMnemonic,
      connect: session.selectWallet,
      disconnect: session.disconnect,
      rederive: session.setAccountCount,
    }),
    [session],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet(): WalletState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useWallet must be called inside <WalletProvider>');
  return v;
}
