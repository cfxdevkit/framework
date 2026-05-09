import type { Address } from '@cfxdevkit/core/types';
import { useClient } from '@cfxdevkit/react/context';
import { useQuery } from '@tanstack/react-query';
import type { SwapService } from '../service/SwapService.js';

export interface UsePoolTokensInput {
  /** SwapService instance — supplies the on-chain read capability. */
  service: SwapService;
  /** The Swappi V2 pair contract address. */
  pairAddress: Address | null | undefined;
  /** Refetch interval in ms. Default: 15_000. */
  refreshMs?: number;
  enabled?: boolean;
}

export interface PoolData {
  token0: Address;
  token1: Address;
  reserve0: bigint;
  reserve1: bigint;
}

export interface UsePoolTokensReturn {
  pool: PoolData | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches token pair info and current reserves from a Swappi V2 pair contract.
 *
 * @example
 * ```tsx
 * const { pool } = usePoolTokens({ service, pairAddress: '0x...' });
 * ```
 */
export function usePoolTokens(input: UsePoolTokensInput): UsePoolTokensReturn {
  const client = useClient();
  const { service, pairAddress, refreshMs = 15_000, enabled = true } = input;

  const { data, isLoading, error, refetch } = useQuery<PoolData, Error>({
    queryKey: ['cfx', 'pool-tokens', client.chain.id, pairAddress],
    enabled: enabled && !!pairAddress,
    staleTime: refreshMs,
    refetchInterval: refreshMs,
    queryFn: () => service.getPoolTokens(pairAddress as Address),
  });

  return { pool: data, isLoading, error, refetch };
}
