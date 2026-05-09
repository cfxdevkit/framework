import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildAddChainParams,
  type CoreChainConfig,
  detectFluentCore,
  type FluentProvider,
  formatProviderError,
  normalizeCoreChainId,
  rpcCoreAccounts,
  rpcCoreChainId,
  rpcRequestCoreAccounts,
  switchConfluxChain,
  type WalletStatus,
  waitForCoreChain,
} from '../lib/coreWalletPrimitives.js';

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

  const syncState = useCallback(async (provider: FluentProvider) => {
    const [chainId, accounts] = await Promise.all([
      rpcCoreChainId(provider),
      rpcCoreAccounts(provider),
    ]);
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
      setState((prev) => ({ ...prev, chainId: normalizeCoreChainId(chainId) }));
    };

    detectFluentCore().then((provider) => {
      if (cancelled) return;
      if (!provider) {
        setState({ status: 'not-installed', account: null, chainId: null });
        return;
      }
      providerRef.current = provider;
      provider.on('accountsChanged', onAccountsChanged);
      provider.on('chainChanged', onChainChanged);
      syncState(provider).catch(() => {
        if (!cancelled) setState({ status: 'not-active', account: null, chainId: null });
      });
    });

    return () => {
      cancelled = true;
      const provider = providerRef.current;
      if (provider) {
        provider.removeListener('accountsChanged', onAccountsChanged);
        provider.removeListener('chainChanged', onChainChanged);
      }
    };
  }, [syncState]);

  const connect = useCallback(async () => {
    const provider = providerRef.current;
    if (!provider || state.status !== 'not-active') return;
    setError(null);
    setState((prev) => ({ ...prev, status: 'connecting' }));
    try {
      const accounts = await rpcRequestCoreAccounts(provider);
      const account = accounts[0] ?? null;
      const chainId = await rpcCoreChainId(provider);
      setState({ status: account ? 'active' : 'not-active', account, chainId });
    } catch (error) {
      setState((prev) => ({ ...prev, status: 'not-active' }));
      if ((error as { code?: number }).code !== 4001) {
        setError(formatProviderError(error));
      }
    }
  }, [state.status]);

  const switchChain = useCallback(async (target: CoreChainConfig) => {
    const provider = providerRef.current;
    if (!provider) return;
    setIsSwitching(true);
    setError(null);
    try {
      await switchConfluxChain(
        provider,
        target.chainIdHex,
        buildAddChainParams(target, target.rpcUrl),
      );
      await waitForCoreChain(provider, target.chainIdHex);
      const chainId = await rpcCoreChainId(provider);
      setState((prev) => ({ ...prev, chainId }));
    } catch (error) {
      if ((error as { code?: number }).code !== 4001) {
        setError(formatProviderError(error));
      }
    } finally {
      setIsSwitching(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const provider = providerRef.current;
    if (!provider) return;
    setIsRefreshing(true);
    try {
      await syncState(provider);
    } catch {
      // Ignore transient provider failures during polling/refresh.
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
