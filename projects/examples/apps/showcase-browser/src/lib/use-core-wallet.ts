import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildAddChainParams,
  type CoreChainConfig,
  detectFluent,
  type FluentProvider,
  formatProviderError,
  normalizeChainId,
  rpcAccounts,
  rpcChainId,
  rpcRequestAccounts,
  switchConfluxChain,
  type WalletStatus,
  waitForChain,
} from './core-wallet-primitives.js';

export * from './core-wallet-primitives.js';

interface WalletState {
  status: WalletStatus;
  account: string | null;
  chainId: string | null;
}

export function useCoreWallet() {
  const [state, setState] = useState<WalletState>({
    status: 'detecting',
    account: null,
    chainId: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const providerRef = useRef<FluentProvider | null>(null);

  const syncState = useCallback(async (p: FluentProvider) => {
    const [chainId, accounts] = await Promise.all([rpcChainId(p), rpcAccounts(p)]);
    const account = accounts[0] ?? null;
    setState({ status: account ? 'active' : 'not-active', account, chainId });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const onAccountsChanged = (accounts: unknown) => {
      if (cancelled) return;
      const list = Array.isArray(accounts) ? (accounts as string[]) : [];
      const account = list[0] ?? null;
      setState((prev) => ({ ...prev, status: account ? 'active' : 'not-active', account }));
    };

    const onChainChanged = (chainId: unknown) => {
      if (cancelled) return;
      if (typeof chainId !== 'string' || !chainId || chainId === '0xNaN') {
        setState((prev) => ({ ...prev, chainId: null }));
        return;
      }
      setState((prev) => ({ ...prev, chainId: normalizeChainId(chainId) }));
    };

    detectFluent().then((p) => {
      if (cancelled) return;
      if (!p) {
        setState({ status: 'not-installed', account: null, chainId: null });
        return;
      }
      providerRef.current = p;
      p.on('accountsChanged', onAccountsChanged);
      p.on('chainChanged', onChainChanged);
      syncState(p).catch(() => {
        if (!cancelled) setState({ status: 'not-active', account: null, chainId: null });
      });
    });

    return () => {
      cancelled = true;
      const p = providerRef.current;
      if (p) {
        p.removeListener('accountsChanged', onAccountsChanged);
        p.removeListener('chainChanged', onChainChanged);
      }
    };
  }, [syncState]);

  const connect = useCallback(async () => {
    const p = providerRef.current;
    if (!p || state.status !== 'not-active') return;
    setError(null);
    setState((prev) => ({ ...prev, status: 'connecting' }));
    try {
      const accounts = await rpcRequestAccounts(p);
      const account = accounts[0] ?? null;
      const chainId = await rpcChainId(p);
      setState({ status: account ? 'active' : 'not-active', account, chainId });
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, status: 'not-active' }));
      if ((err as { code?: number })?.code !== 4001) setError(formatProviderError(err));
    }
  }, [state.status]);

  const switchChain = useCallback(async (target: CoreChainConfig) => {
    const p = providerRef.current;
    if (!p) return;
    setIsSwitching(true);
    setError(null);
    try {
      await switchConfluxChain(p, target.chainIdHex, buildAddChainParams(target, target.rpcUrl));
      await waitForChain(p, target.chainIdHex);
      const chainId = await rpcChainId(p);
      setState((prev) => ({ ...prev, chainId }));
    } catch (err: unknown) {
      if ((err as { code?: number })?.code !== 4001) setError(formatProviderError(err));
    } finally {
      setIsSwitching(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const p = providerRef.current;
    if (!p) return;
    setIsRefreshing(true);
    try {
      await syncState(p);
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  }, [syncState]);

  const disconnect = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'not-active', account: null }));
    setError(null);
  }, []);

  return {
    status: state.status,
    address: state.account,
    chainId: state.chainId,
    error,
    isConnected: state.status === 'active',
    isConnecting: state.status === 'connecting',
    isDetecting: state.status === 'detecting',
    isInstalled: state.status !== 'not-installed',
    isRefreshing,
    isSwitching,
    connect,
    disconnect,
    switchChain,
    refresh,
  };
}
