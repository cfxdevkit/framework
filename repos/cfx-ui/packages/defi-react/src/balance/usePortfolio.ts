import type { Address, Wei } from '@cfxdevkit/core/types';
import { useNativeBalance } from '@cfxdevkit/react/balance';
import { useClient } from '@cfxdevkit/react/context';
import { useQueries } from '@tanstack/react-query';
import { decodeFunctionResult, encodeFunctionData } from 'viem';
import type { PortfolioRow, TokenInfo } from '../types.js';

export interface UsePortfolioInput {
  address?: Address | null;
  tokens: TokenInfo[];
  /** Refetch interval in ms. Default: 15_000. */
  refreshMs?: number;
}

export interface UsePortfolioReturn {
  rows: PortfolioRow[];
  isLoading: boolean;
  error: Error | null;
}

const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

function formatBigInt(value: Wei, decimals: number): string {
  if (value === 0n) return '0';
  const factor = BigInt(10 ** decimals);
  const whole = value / factor;
  const frac = value % factor;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole}.${fracStr.slice(0, 6)}`;
}

/**
 * Fetches balances for a list of tokens (ERC-20) plus native CFX for a given
 * address. Returns formatted rows sorted by balance descending.
 */
export function usePortfolio(input: UsePortfolioInput): UsePortfolioReturn {
  const client = useClient();
  const { address, tokens, refreshMs = 15_000 } = input;

  // Native CFX balance
  const {
    data: nativeBalance,
    isLoading: nativeLoading,
    error: nativeError,
  } = useNativeBalance({
    address: address ?? undefined,
    enabled: !!address,
    staleTimeMs: refreshMs,
  });

  // All ERC-20 balances via parallel queries
  const tokenQueries = useQueries({
    queries: tokens.map((token) => ({
      queryKey: ['cfx', 'portfolioBalance', client.chain.id, token.address, address],
      enabled: !!address,
      staleTime: refreshMs,
      queryFn: async (): Promise<Wei> => {
        const calldata = encodeFunctionData({
          abi: ERC20_BALANCE_ABI,
          functionName: 'balanceOf',
          args: [address as Address],
        });
        const raw = await client.request<`0x${string}`>({
          method: 'eth_call',
          params: [{ to: token.address, data: calldata }, 'latest'],
        });
        return decodeFunctionResult({
          abi: ERC20_BALANCE_ABI,
          functionName: 'balanceOf',
          data: raw,
        }) as Wei;
      },
    })),
  });

  const isLoading = nativeLoading || tokenQueries.some((q) => q.isLoading);
  const error =
    (nativeError as Error | null) ??
    (tokenQueries.find((q) => q.error)?.error as Error | null) ??
    null;

  // Build rows — include native CFX row if balance available
  const rows: PortfolioRow[] = [];

  if (nativeBalance !== undefined) {
    rows.push({
      token: {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'CFX',
        name: 'Conflux',
        decimals: 18,
        chainId: client.chain.id,
      },
      balance: nativeBalance,
      formatted: formatBigInt(nativeBalance, 18),
    });
  }

  tokens.forEach((token, i) => {
    const bal = tokenQueries[i]?.data;
    if (bal !== undefined) {
      rows.push({
        token,
        balance: bal,
        formatted: formatBigInt(bal, token.decimals),
      });
    }
  });

  // Sort by balance descending (larger balances first)
  rows.sort((a, b) => (a.balance > b.balance ? -1 : a.balance < b.balance ? 1 : 0));

  return { rows, isLoading, error };
}
