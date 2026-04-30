/**
 * useCoreWallet — React hook for Fluent wallet (Conflux Core Space).
 *
 * Ported from @devkit/conflux-wallet. Drives window.conflux directly
 * WITHOUT @cfxjs/use-wallet-react.
 *
 * Connection flow:
 *   1. connect()     — authorize the dapp (shows Fluent popup, NO chain switch)
 *   2. switchChain() — switch network explicitly (separate user action)
 *
 * Chain IDs are always stored as lowercase hex (e.g. "0x405").
 */
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Provider interface ────────────────────────────────────────────────────

export interface FluentProvider {
  isFluent?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

// ── Low-level provider primitives ─────────────────────────────────────────

export function normalizeChainId(raw: string): string {
  if (!raw || raw === '0xNaN') return raw;
  const num = Number(raw);
  if (!Number.isNaN(num) && num > 0) return `0x${num.toString(16)}`;
  return raw.toLowerCase();
}

export function getFluentProvider(): FluentProvider | null {
  const w = window as unknown as { conflux?: FluentProvider };
  return w.conflux?.isFluent ? w.conflux : null;
}

/**
 * Detect window.conflux with exponential back-off.
 * Fluent injects asynchronously, so we retry for up to maxMs.
 */
export async function detectFluent(maxMs = 3_000): Promise<FluentProvider | null> {
  const deadline = Date.now() + maxMs;
  let delay = 50;
  while (Date.now() < deadline) {
    const p = getFluentProvider();
    if (p) return p;
    await new Promise<void>((r) => setTimeout(r, delay));
    delay = Math.min(delay * 2, 500);
  }
  return getFluentProvider();
}

export async function rpcChainId(p: FluentProvider): Promise<string | null> {
  try {
    const id = (await p.request({ method: 'cfx_chainId' })) as string;
    if (!id || id === '0xNaN') return null;
    return normalizeChainId(id);
  } catch {
    return null;
  }
}

export async function rpcAccounts(p: FluentProvider): Promise<string[]> {
  try {
    const result = (await p.request({ method: 'cfx_accounts' })) as string[];
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

export async function rpcRequestAccounts(p: FluentProvider): Promise<string[]> {
  const result = (await p.request({ method: 'cfx_requestAccounts' })) as string[];
  return Array.isArray(result) ? result : [];
}

export interface ConfluxAddChainParams {
  chainId: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}

/**
 * Try wallet_switchConfluxChain.
 * On code 4902 (chain not registered), adds it first then retries.
 * Throws on user rejection (code 4001).
 */
export async function switchConfluxChain(
  p: FluentProvider,
  chainId: string,
  addParams: ConfluxAddChainParams,
): Promise<void> {
  try {
    await p.request({ method: 'wallet_switchConfluxChain', params: [{ chainId }] });
  } catch (switchErr) {
    const code = (switchErr as { code?: number })?.code;
    if (code === 4001) throw switchErr;

    if (code === 4902 || code === -32603) {
      let added = false;
      for (const rpcUrl of addParams.rpcUrls) {
        try {
          await p.request({
            method: 'wallet_addConfluxChain',
            params: [{ ...addParams, rpcUrls: [rpcUrl] }],
          });
          added = true;
          break;
        } catch (addErr) {
          if ((addErr as { code?: number })?.code === 4001) throw addErr;
        }
      }
      if (!added) throw switchErr;
      await p.request({ method: 'wallet_switchConfluxChain', params: [{ chainId }] });
    } else {
      throw switchErr;
    }
  }
}

/**
 * Wait for a chainChanged event matching targetHex, with polling fallback.
 * Resolves true when matched, false on timeout.
 */
export function waitForChain(
  p: FluentProvider,
  targetHex: string,
  maxMs = 10_000,
  pollIntervalMs = 300,
): Promise<boolean> {
  const target = targetHex.toLowerCase();
  return new Promise<boolean>((resolve) => {
    let done = false;
    let pollTimer: ReturnType<typeof setTimeout>;

    const finish = (matched: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(pollTimer);
      p.removeListener('chainChanged', onChainChanged);
      resolve(matched);
    };

    const onChainChanged = (chainId: unknown) => {
      if (typeof chainId !== 'string') return;
      if (normalizeChainId(chainId) === target) finish(true);
    };

    p.on('chainChanged', onChainChanged);

    const poll = async () => {
      const id = await rpcChainId(p);
      if (id === target) {
        finish(true);
        return;
      }
      if (!done) pollTimer = setTimeout(poll, pollIntervalMs);
    };
    pollTimer = setTimeout(poll, pollIntervalMs);

    setTimeout(() => finish(false), maxMs);
  });
}

export function formatProviderError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const e = err as { message?: string };
    if (e.message) return e.message;
  }
  return String(err);
}

// ── Chain configs ─────────────────────────────────────────────────────────

export interface CoreChainConfig {
  coreChainId: number;
  /** Lowercase hex, e.g. "0x405" */
  chainIdHex: string;
  label: string;
  rpcUrl: string;
  /** Ordered list of RPC URLs to try when adding the chain. */
  rpcUrls: string[];
  blockExplorerUrl?: string;
}

export function buildAddChainParams(
  target: CoreChainConfig,
  rpcUrl: string,
): ConfluxAddChainParams {
  return {
    chainId: target.chainIdHex,
    chainName: `Conflux ${target.label}`,
    nativeCurrency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
    rpcUrls: [rpcUrl],
    ...(target.blockExplorerUrl ? { blockExplorerUrls: [target.blockExplorerUrl] } : {}),
  };
}

export const CORE_CHAIN_CONFIGS: Record<number, CoreChainConfig> = {
  1: {
    coreChainId: 1,
    chainIdHex: '0x1',
    label: 'Core Testnet',
    rpcUrl: 'https://test.confluxrpc.com',
    rpcUrls: ['https://test.confluxrpc.com'],
    blockExplorerUrl: 'https://testnet.confluxscan.org',
  },
  1029: {
    coreChainId: 1029,
    chainIdHex: '0x405',
    label: 'Core Mainnet',
    rpcUrl: 'https://main.confluxrpc.com',
    rpcUrls: ['https://main.confluxrpc.com'],
    blockExplorerUrl: 'https://confluxscan.org',
  },
};

/** Look up a CoreChainConfig by its hex chain ID. */
export function getCoreChainConfig(chainIdHex: string): CoreChainConfig | null {
  const target = chainIdHex.toLowerCase();
  return Object.values(CORE_CHAIN_CONFIGS).find((c) => c.chainIdHex === target) ?? null;
}

// ── useCoreWallet hook ────────────────────────────────────────────────────

export type WalletStatus = 'detecting' | 'not-installed' | 'not-active' | 'connecting' | 'active';

interface WalletState {
  status: WalletStatus;
  account: string | null;
  /** Normalized lowercase hex chain ID, e.g. "0x7ed". Null until known. */
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

  // Read both accounts and chainId in one pass, no popup.
  const syncState = useCallback(async (p: FluentProvider) => {
    const [chainId, accounts] = await Promise.all([rpcChainId(p), rpcAccounts(p)]);
    const account = accounts[0] ?? null;
    setState({ status: account ? 'active' : 'not-active', account, chainId });
  }, []);

  // ── Detection + event subscription ──────────────────────────────────────
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

  // ── connect — authorize only, NEVER switches chain ───────────────────────
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

  // ── switchChain — explicit, user-triggered only ──────────────────────────
  const switchChain = useCallback(async (target: CoreChainConfig) => {
    const p = providerRef.current;
    if (!p) return;
    setIsSwitching(true);
    setError(null);
    try {
      await switchConfluxChain(p, target.chainIdHex, buildAddChainParams(target, target.rpcUrl));
      await waitForChain(p, target.chainIdHex);
      // Force-read to ensure state is correct regardless of event timing.
      const chainId = await rpcChainId(p);
      setState((prev) => ({ ...prev, chainId }));
    } catch (err: unknown) {
      if ((err as { code?: number })?.code !== 4001) setError(formatProviderError(err));
    } finally {
      setIsSwitching(false);
    }
  }, []);

  // ── refresh — re-read state without popup ────────────────────────────────
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

  // ── disconnect — clears local state (Fluent has no programmatic revoke) ──
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
