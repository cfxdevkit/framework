import type { Address, Hex, Signer } from '@cfxdevkit/core';
import {
  coreAddressFromPrivateKey,
  deriveAccount,
  generateMnemonic,
  signerFromPrivateKey,
  validateMnemonic,
} from '@cfxdevkit/core';
import type {
  Capability,
  KeystoreProvider,
  SecretRef,
  StoredSecret,
} from '@cfxdevkit/services/keystore';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNetwork } from './NetworkProvider.js';

export const DEFAULT_SHOWCASE_MNEMONIC =
  'test test test test test test test test test test test junk';

const SERVICE = 'showcase';

export type KeystoreSessionStatus = 'unconfigured' | 'locked' | 'unlocking' | 'ready' | 'error';

export interface ShowcaseAccount {
  index: number;
  ref: SecretRef;
  evmAddress: Address;
  coreAddress: string;
  privateKey: Hex;
  publicKey: Hex;
  paths: { evm: string; core: string };
}

export interface KeystoreSessionState {
  status: KeystoreSessionStatus;
  backendId: string;
  networkId: 'mainnet' | 'testnet' | 'local';
  chainIds: readonly number[];
  wallets: readonly StoredSecret[];
  accounts: readonly ShowcaseAccount[];
  activeWalletRef: SecretRef | null;
  activeIndex: number | null;
  active: ShowcaseAccount | null;
  activeRef: SecretRef | null;
  activeSigner: Signer | null;
  capability: Capability;
  sessionId: string;
  mnemonic: string;
  accountCount: number;
  error: string | null;
  setMnemonic: (mnemonic: string) => void;
  createMnemonic: () => void;
  resetMnemonic: () => void;
  setAccountCount: (count: number) => void;
  addWallet: () => void;
  selectMnemonic: (ref: SecretRef) => void;
  selectWallet: (index: number) => void;
  disconnect: () => void;
  removeWallet: (ref: SecretRef) => Promise<void>;
  restoreRemovedWallets: () => void;
  signMessage: (
    ref: SecretRef,
    message: string,
    capability?: Capability,
  ) => Promise<{ account: string; signature: Hex }>;
  refreshWallets: () => Promise<void>;
}

const Ctx = createContext<KeystoreSessionState | null>(null);

function refForIndex(index: number): SecretRef {
  return { service: SERVICE, account: `mnemonic-${index}` };
}

function accountRefForIndex(index: number): SecretRef {
  return { service: SERVICE, account: `account-${index}` };
}

function refKey(ref: SecretRef): string {
  return `${ref.service}/${ref.account}`;
}

function refFromKey(key: string): SecretRef {
  const [service, account] = key.split('/');
  return { service: service ?? SERVICE, account: account ?? 'mnemonic-0' };
}

function deriveAccounts(mnemonic: string, count: number, coreNetworkId: number): ShowcaseAccount[] {
  const clean = mnemonic.trim();
  if (!validateMnemonic(clean)) return [];

  const accounts: ShowcaseAccount[] = [];
  for (let index = 0; index < count; index++) {
    const path = `m/44'/60'/0'/0/${index}`;
    const { account, privateKey } = deriveAccount({ mnemonic: clean, path });
    accounts.push({
      index,
      ref: accountRefForIndex(index),
      evmAddress: account.address,
      coreAddress: coreAddressFromPrivateKey(privateKey, coreNetworkId),
      privateKey,
      publicKey: account.publicKey,
      paths: { evm: path, core: path },
    });
  }
  return accounts;
}

export function KeystoreSessionProvider({ children }: { children: ReactNode }) {
  const { network, core, espace } = useNetwork();
  const [keystore, setKeystore] = useState<KeystoreProvider | null>(null);
  const [status, setStatus] = useState<KeystoreSessionStatus>('unconfigured');
  const [mnemonics, setMnemonics] = useState<ReadonlyMap<string, string>>(
    () => new Map([[refKey(refForIndex(0)), DEFAULT_SHOWCASE_MNEMONIC]]),
  );
  const [accountCount, setAccountCountRaw] = useState(5);
  const [activeWalletRef, setActiveWalletRef] = useState<SecretRef>(refForIndex(0));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [wallets, setWallets] = useState<StoredSecret[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('unlocking');
    void import('@cfxdevkit/services/keystore-memory')
      .then((mod) => {
        if (cancelled) return;
        setKeystore(mod.createMemoryKeystore());
        setStatus('ready');
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeWalletKey = refKey(activeWalletRef);
  const mnemonic = mnemonics.get(activeWalletKey) ?? '';
  const accounts = useMemo(
    () => deriveAccounts(mnemonic, accountCount, core.id),
    [mnemonic, accountCount, core.id],
  );

  const refreshWallets = useCallback(async () => {
    if (!keystore) {
      setWallets([]);
      return;
    }
    setWallets(await keystore.list({ service: SERVICE }));
  }, [keystore]);

  useEffect(() => {
    if (!keystore) return;
    let cancelled = false;
    void (async () => {
      try {
        for (const [key, rootMnemonic] of mnemonics) {
          const ref = refFromKey(key);
          await keystore.put?.({
            ref,
            kind: 'mnemonic',
            secret: rootMnemonic,
            meta: {
              label: ref.account,
              storage: 'memory-plaintext',
              accountCount: String(accountCount),
              derivationBase: "m/44'/60'/0'/0",
              source: 'showcase-session-root',
            },
          });
        }
        if (!cancelled) await refreshWallets();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [keystore, mnemonics, accountCount, refreshWallets]);

  useEffect(() => {
    if (activeIndex !== null && !accounts.some((account) => account.index === activeIndex)) {
      setActiveIndex(null);
      setVersion((value) => value + 1);
    }
  }, [activeIndex, accounts]);

  const capability = useMemo<Capability>(
    () => ({ chains: [core.id, espace.id] }),
    [core.id, espace.id],
  );
  const active =
    activeIndex === null
      ? null
      : (accounts.find((account) => account.index === activeIndex) ?? null);
  const activeRef = active?.ref ?? null;
  const activeSigner = useMemo(
    () => (active ? signerFromPrivateKey(active.privateKey, core.id) : null),
    [active, core.id],
  );

  const setMnemonic = useCallback(
    (next: string) => {
      setMnemonics((current) => new Map(current).set(refKey(activeWalletRef), next));
      setActiveIndex(null);
      setVersion((value) => value + 1);
    },
    [activeWalletRef],
  );

  const createMnemonic = useCallback(() => {
    const nextRef = refForIndex(mnemonics.size);
    setMnemonics((current) => new Map(current).set(refKey(nextRef), generateMnemonic(128)));
    setActiveWalletRef(nextRef);
    setActiveIndex(null);
    setVersion((value) => value + 1);
  }, [mnemonics.size]);
  const resetMnemonic = useCallback(() => {
    const ref = refForIndex(0);
    setMnemonics(new Map([[refKey(ref), DEFAULT_SHOWCASE_MNEMONIC]]));
    setActiveWalletRef(ref);
    setActiveIndex(null);
    setVersion((value) => value + 1);
  }, []);

  const setAccountCount = useCallback((next: number) => {
    setAccountCountRaw(Math.max(1, Math.min(50, next)));
    setActiveIndex(null);
    setVersion((value) => value + 1);
  }, []);

  const addWallet = createMnemonic;

  const selectMnemonic = useCallback(
    (ref: SecretRef) => {
      if (!mnemonics.has(refKey(ref))) return;
      setActiveWalletRef(ref);
      setActiveIndex(null);
      setVersion((value) => value + 1);
    },
    [mnemonics],
  );

  const selectWallet = useCallback(
    (index: number) => {
      if (!accounts.some((account) => account.index === index)) return;
      setActiveIndex(index);
      setVersion((value) => value + 1);
    },
    [accounts],
  );

  const disconnect = useCallback(() => {
    setActiveIndex(null);
    setVersion((value) => value + 1);
  }, []);

  const removeWallet = useCallback(
    async (ref: SecretRef) => {
      if (!keystore?.remove) return;
      if (refKey(activeWalletRef) === refKey(ref)) disconnect();
      await keystore.remove(ref);
      setMnemonics((current) => {
        const next = new Map(current);
        next.delete(refKey(ref));
        if (next.size === 0) next.set(refKey(refForIndex(0)), DEFAULT_SHOWCASE_MNEMONIC);
        if (refKey(activeWalletRef) === refKey(ref)) {
          setActiveWalletRef(refFromKey([...next.keys()][0] ?? refKey(refForIndex(0))));
        }
        return next;
      });
      await refreshWallets();
      setVersion((value) => value + 1);
    },
    [keystore, activeWalletRef, disconnect, refreshWallets],
  );

  const restoreRemovedWallets = useCallback(() => {
    resetMnemonic();
    setVersion((value) => value + 1);
  }, [resetMnemonic]);

  const signMessage = useCallback(
    async (ref: SecretRef, message: string, requestedCapability?: Capability) => {
      if (!keystore) throw new Error('Keystore session is not ready.');
      const signer = await keystore.getSigner(ref, requestedCapability ?? capability, {
        derivationPath: `m/44'/60'/0'/0/${activeIndex ?? 0}`,
      });
      const signature = await signer.signMessage(message);
      return { account: signer.account.address, signature };
    },
    [keystore, capability, activeIndex],
  );

  const sessionId = useMemo(
    () =>
      [keystore?.id ?? 'none', network.id, core.id, espace.id, activeIndex ?? 'none', version].join(
        ':',
      ),
    [keystore?.id, network.id, core.id, espace.id, activeIndex, version],
  );

  const value: KeystoreSessionState = {
    status,
    backendId: keystore?.id ?? 'memory',
    networkId: network.id,
    chainIds: capability.chains ?? [],
    wallets,
    accounts,
    activeWalletRef,
    activeIndex,
    active,
    activeRef,
    activeSigner,
    capability,
    sessionId,
    mnemonic,
    accountCount,
    error,
    setMnemonic,
    createMnemonic,
    resetMnemonic,
    setAccountCount,
    addWallet,
    selectMnemonic,
    selectWallet,
    disconnect,
    removeWallet,
    restoreRemovedWallets,
    signMessage,
    refreshWallets,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useKeystoreSession(): KeystoreSessionState {
  const value = useContext(Ctx);
  if (!value) throw new Error('useKeystoreSession must be called inside <KeystoreSessionProvider>');
  return value;
}
