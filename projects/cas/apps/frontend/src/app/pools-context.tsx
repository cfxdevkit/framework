'use client';

import {
  type CasHexAddress,
  type CasPoolsResponse,
  type CasTokenInfo,
  ZERO_ADDRESS,
} from '@cfxdevkit/cas-shared';
import { WCFX_ADDRESSES } from '@cfxdevkit/protocol';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount, usePublicClient } from 'wagmi';
import { useAuthContext } from './auth-context';

// ── Constants ─────────────────────────────────────────────────────────────────

export const CFX_NATIVE_ADDRESS = ZERO_ADDRESS as CasHexAddress;

const BALANCE_OF_ABI = [
  {
    type: 'function' as const,
    name: 'balanceOf',
    stateMutability: 'view' as const,
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TokenWithBalance extends CasTokenInfo {
  balanceWei?: string;
  balanceFormatted?: string;
}

export interface PoolsContextValue {
  tokens: TokenWithBalance[];
  pairs: CasPoolsResponse['pairs'];
  loading: boolean;
  balancesLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const PoolsContext = createContext<PoolsContextValue>({
  tokens: [],
  pairs: [],
  loading: false,
  balancesLoading: false,
  error: null,
  refresh: () => {},
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildTokenList(pools: CasPoolsResponse, wcfxAddress: string): TokenWithBalance[] {
  const native: TokenWithBalance = {
    address: CFX_NATIVE_ADDRESS,
    symbol: 'CFX',
    name: 'Conflux',
    decimals: 18,
  };
  const seen = new Set<string>([native.address.toLowerCase()]);
  const list: TokenWithBalance[] = [native];

  for (const token of pools.tokens) {
    const norm = token.address.toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    list.push(token);
  }

  const wcfxLower = wcfxAddress.toLowerCase();
  if (wcfxLower !== ZERO_ADDRESS.toLowerCase() && !seen.has(wcfxLower)) {
    list.push({
      address: wcfxAddress as CasHexAddress,
      symbol: 'WCFX',
      name: 'Wrapped CFX',
      decimals: 18,
    });
  }

  return list.sort((a, b) => (a.symbol === 'CFX' ? -1 : a.symbol.localeCompare(b.symbol)));
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function PoolsProvider({ children }: { children: React.ReactNode }) {
  const { client } = useAuthContext();
  const { address: account } = useAccount();
  const publicClient = usePublicClient();

  const wcfxAddress = readEnvAddress(process.env.NEXT_PUBLIC_WCFX_ADDRESS, WCFX_ADDRESSES.mainnet);

  const [rawPools, setRawPools] = useState<CasPoolsResponse | null>(null);
  const [baseTokens, setBaseTokens] = useState<TokenWithBalance[]>([]);
  const [tokens, setTokens] = useState<TokenWithBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track which account we last loaded balances for to avoid redundant calls
  const balanceAccount = useRef<string | null>(null);

  const loadPools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pools = await client.pools();
      setRawPools(pools);
      const base = buildTokenList(pools, wcfxAddress);
      setBaseTokens(base);
      setTokens(base);
      balanceAccount.current = null; // force balance refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pools');
    } finally {
      setLoading(false);
    }
  }, [client, wcfxAddress]);

  // Load pools on mount (public endpoint — no auth required)
  useEffect(() => {
    void loadPools();
  }, [loadPools]);

  // Reload balances when account or base token list changes
  useEffect(() => {
    if (!account || !publicClient || baseTokens.length === 0) {
      if (!account) {
        balanceAccount.current = null;
        setTokens(baseTokens);
      }
      return;
    }
    if (balanceAccount.current === account) return;
    balanceAccount.current = account;
    setBalancesLoading(true);

    void Promise.all(
      baseTokens.map(async (token) => {
        try {
          const decimals = token.decimals ?? 18;
          const isNative = token.address.toLowerCase() === CFX_NATIVE_ADDRESS.toLowerCase();
          const balance = isNative
            ? await publicClient.getBalance({ address: account })
            : await publicClient.readContract({
                address: token.address,
                abi: BALANCE_OF_ABI,
                functionName: 'balanceOf',
                args: [account],
              });
          return {
            ...token,
            balanceWei: (balance as bigint).toString(),
            balanceFormatted: formatUnits(balance as bigint, decimals),
          };
        } catch {
          return token;
        }
      }),
    ).then((withBalances) => {
      setTokens(withBalances);
      setBalancesLoading(false);
    });
  }, [account, publicClient, baseTokens]);

  const refresh = useCallback(() => {
    balanceAccount.current = null;
    void loadPools();
  }, [loadPools]);

  return (
    <PoolsContext.Provider
      value={{
        tokens,
        pairs: rawPools?.pairs ?? [],
        loading,
        balancesLoading,
        error,
        refresh,
      }}
    >
      {children}
    </PoolsContext.Provider>
  );
}

function readEnvAddress(value: string | undefined, fallback: CasHexAddress): CasHexAddress {
  return value?.startsWith('0x') ? (value as CasHexAddress) : fallback;
}

export function usePoolsContext(): PoolsContextValue {
  return useContext(PoolsContext);
}
