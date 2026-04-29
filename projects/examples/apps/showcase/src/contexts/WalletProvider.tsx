/**
 * Wallet context — manages a "connected" account derived from a local
 * mnemonic. Acts as a stand-in for a browser wallet (Fluent/MetaMask) so the
 * showcase has zero external dependencies but still demonstrates SIWE,
 * delegation, signing, etc.
 */

import type { Address, Hex, Signer } from '@cfxdevkit/core';
import {
  coreAddressFromPrivateKey,
  deriveAccount,
  signerFromPrivateKey,
  validateMnemonic,
} from '@cfxdevkit/core';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { useNetwork } from './NetworkProvider.js';

export const TEST_MNEMONIC = 'test test test test test test test test test test test junk';

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
export interface ShowcaseAccount {
  index: number;
  evmAddress: Address;
  coreAddress: string;
  privateKey: Hex;
  publicKey: Hex;
  paths: { evm: string; core: string };
}

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
  const { core } = useNetwork();
  const coreNetworkId = core.id; // 1029 mainnet, 1 testnet, 2029 local
  const [mnemonic, setMnemonicRaw] = useState<string>(TEST_MNEMONIC);
  const [count, setCount] = useState<number>(5);
  const [activeIndex, setActive] = useState<number | null>(null);

  const accounts = useMemo<ShowcaseAccount[]>(() => {
    const m = mnemonic.trim();
    if (!validateMnemonic(m)) return [];
    try {
      const out: ShowcaseAccount[] = [];
      for (let i = 0; i < count; i++) {
        const path = `m/44'/60'/0'/0/${i}`;
        const { account, privateKey } = deriveAccount({ mnemonic: m, path });
        out.push({
          index: i,
          evmAddress: account.address,
          // Re-encode the SAME key as Core base32 \u2014 the prefix
          // (cfx:/cfxtest:/net2029:) follows the active network.
          coreAddress: coreAddressFromPrivateKey(privateKey, coreNetworkId),
          privateKey,
          publicKey: account.publicKey,
          paths: { evm: path, core: path },
        });
      }
      return out;
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
