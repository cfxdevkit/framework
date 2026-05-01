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
  selectWallet: (index: number) => void;
  disconnect: () => void;
  removeWallet: (ref: SecretRef) => Promise<void>;
  signMessage: (
    ref: SecretRef,
    message: string,
    capability?: Capability,
  ) => Promise<{ account: string; signature: Hex }>;
  refreshWallets: () => Promise<void>;
}

const Ctx = createContext<KeystoreSessionState | null>(null);

function refForIndex(index: number): SecretRef {
  return { service: SERVICE, account: `wallet-${index}` };
}

function refKey(ref: SecretRef): string {
  return `${ref.service}/${ref.account}`;
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
      ref: refForIndex(index),
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
  const [mnemonic, setMnemonicRaw] = useState(DEFAULT_SHOWCASE_MNEMONIC);
  const [accountCount, setAccountCountRaw] = useState(5);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [wallets, setWallets] = useState<StoredSecret[]>([]);
  const [removedRefs, setRemovedRefs] = useState<ReadonlySet<string>>(() => new Set());
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

  const accounts = useMemo(
    () =>
      deriveAccounts(mnemonic, accountCount, core.id).filter(
        (account) => !removedRefs.has(refKey(account.ref)),
      ),
    [mnemonic, accountCount, core.id, removedRefs],
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
        for (const account of accounts) {
          await keystore.put?.({
            ref: account.ref,
            kind: 'private-key',
            secret: account.privateKey,
            meta: {
              index: String(account.index),
              evm: account.evmAddress,
              core: account.coreAddress,
              source: 'showcase-session',
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
  }, [keystore, accounts, refreshWallets]);

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

  const setMnemonic = useCallback((next: string) => {
    setMnemonicRaw(next);
    setRemovedRefs(new Set());
    setActiveIndex(null);
    setVersion((value) => value + 1);
  }, []);

  const createMnemonic = useCallback(() => setMnemonic(generateMnemonic(128)), [setMnemonic]);
  const resetMnemonic = useCallback(() => setMnemonic(DEFAULT_SHOWCASE_MNEMONIC), [setMnemonic]);

  const setAccountCount = useCallback((next: number) => {
    setAccountCountRaw(Math.max(1, Math.min(50, next)));
    setRemovedRefs(new Set());
    setActiveIndex(null);
    setVersion((value) => value + 1);
  }, []);

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
      if (activeRef && refKey(activeRef) === refKey(ref)) disconnect();
      await keystore.remove(ref);
      setRemovedRefs((current) => new Set([...current, refKey(ref)]));
      await refreshWallets();
      setVersion((value) => value + 1);
    },
    [keystore, activeRef, disconnect, refreshWallets],
  );

  const signMessage = useCallback(
    async (ref: SecretRef, message: string, requestedCapability?: Capability) => {
      if (!keystore) throw new Error('Keystore session is not ready.');
      const signer = await keystore.getSigner(ref, requestedCapability ?? capability);
      const signature = await signer.signMessage(message);
      return { account: signer.account.address, signature };
    },
    [keystore, capability],
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
    selectWallet,
    disconnect,
    removeWallet,
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
