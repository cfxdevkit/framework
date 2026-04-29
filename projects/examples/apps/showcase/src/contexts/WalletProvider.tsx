/**
 * Wallet context — manages a "connected" account derived from a local
 * mnemonic. Acts as a stand-in for a browser wallet (Fluent/MetaMask) so the
 * showcase has zero external dependencies but still demonstrates SIWE,
 * delegation, signing, etc.
 */

import type { Signer } from '@cfxdevkit/core';
import {
  type DualAddressAccount,
  deriveDualAccounts,
  signerFromPrivateKey,
  validateMnemonic,
} from '@cfxdevkit/core';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { useNetwork } from './NetworkProvider.js';

export const TEST_MNEMONIC = 'test test test test test test test test test test test junk';

export interface WalletState {
  /** The pool of accounts derived from the active mnemonic. */
  accounts: DualAddressAccount[];
  /** Which account index is "connected". `null` when disconnected. */
  activeIndex: number | null;
  active: DualAddressAccount | null;
  signer: Signer | null;
  mnemonic: string;
  setMnemonic: (m: string) => void;
  connect: (index: number) => void;
  disconnect: () => void;
  rederive: (count: number) => void;
}

const Ctx = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { core } = useNetwork();
  const coreNetworkId = core.id; // 1029 mainnet, 1 testnet, 2029 local
  const [mnemonic, setMnemonicRaw] = useState<string>(TEST_MNEMONIC);
  const [count, setCount] = useState<number>(5);
  const [activeIndex, setActive] = useState<number | null>(null);

  const accounts = useMemo<DualAddressAccount[]>(() => {
    if (!validateMnemonic(mnemonic.trim())) return [];
    try {
      // Derive Core addresses with the *active network's* networkId so
      // `account.coreAddress` matches what the signer broadcasts from. The
      // base32 prefix changes per network (cfx: / cfxtest: / net2029:).
      return deriveDualAccounts({ mnemonic: mnemonic.trim(), count, coreNetworkId });
    } catch {
      return [];
    }
  }, [mnemonic, count, coreNetworkId]);

  const setMnemonic = useCallback((m: string) => {
    setMnemonicRaw(m);
    setActive(null);
  }, []);

  const connect = useCallback(
    (index: number) => {
      if (index < 0 || index >= accounts.length) return;
      setActive(index);
    },
    [accounts.length],
  );

  const disconnect = useCallback(() => setActive(null), []);

  const rederive = useCallback((c: number) => {
    setCount(Math.max(1, Math.min(50, c)));
    setActive(null);
  }, []);

  const active = activeIndex !== null ? (accounts[activeIndex] ?? null) : null;
  const signer = useMemo<Signer | null>(
    // Signer's networkId tracks the active network so coreAddress + tx
    // broadcasts agree.
    () => (active ? signerFromPrivateKey(active.privateKey, coreNetworkId) : null),
    [active, coreNetworkId],
  );

  const value: WalletState = {
    accounts,
    activeIndex,
    active,
    signer,
    mnemonic,
    setMnemonic,
    connect,
    disconnect,
    rederive,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet(): WalletState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useWallet must be called inside <WalletProvider>');
  return v;
}
