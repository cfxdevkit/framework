import type { Address } from '@cfxdevkit/core/types';
import { useClient } from '@cfxdevkit/react/context';
import { useQueries } from '@tanstack/react-query';
import type { SwapService } from '../service/SwapService.js';
import type { PoolData } from './usePoolTokens.js';

export interface UsePoolsInput {
  /** SwapService instance. */
  service: SwapService;
  /** List of pair addresses to query. */
  pairAddresses: Address[];
  /** Refetch interval in ms. Default: 15_000. */
  refreshMs?: number;
  enabled?: boolean;
}

export interface UsePoolsReturn {
  /** Map of pair address (lower-case) → pool data. Undefined if not yet loaded. */
  pools: Map<Address, PoolData>;
  isLoading: boolean;
  errors: Array<Error | null>;
}

/**
 * Bulk hook to fetch pool data for multiple Swappi V2 pair addresses.
 *
 * @example
 * ```tsx
 * const { pools } = usePools({ service, pairAddresses: ['0x...', '0x...'] });
 * ```
 */
export function usePools(input: UsePoolsInput): UsePoolsReturn {
  const client = useClient();
  const { service, pairAddresses, refreshMs = 15_000, enabled = true } = input;

  const results = useQueries({
    queries: pairAddresses.map((addr) => ({
      queryKey: ['cfx', 'pool-tokens', client.chain.id, addr],
      enabled,
      staleTime: refreshMs,
      refetchInterval: refreshMs,
      queryFn: () => service.getPoolTokens(addr),
    })),
  });

  const pools = new Map<Address, PoolData>();
  for (let i = 0; i < pairAddresses.length; i++) {
    const result = results[i];
    const addr = pairAddresses[i];
    if (result?.data && addr) {
      pools.set(addr.toLowerCase() as Address, result.data);
    }
  }

  const isLoading = results.some((r) => r.isLoading);
  const errors = results.map((r) => (r.error instanceof Error ? r.error : null));

  return { pools, isLoading, errors };
}
