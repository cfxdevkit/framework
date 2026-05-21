import type { Address } from '@cfxdevkit/cdk/types';
import { useClient } from '@cfxdevkit/react/context';
import { useQuery } from '@tanstack/react-query';
import type { SwapService } from '../service/SwapService.js';

export interface UseTokenPriceInput {
  /** SwapService instance. */
  service: SwapService;
  /** Token whose price to fetch. */
  tokenAddress: Address | null | undefined;
  /** Quote token (e.g. USDT address or WCFX address). */
  quoteToken: Address;
  /** Refetch interval in ms. Default: 30_000. */
  refreshMs?: number;
  enabled?: boolean;
}

export interface UseTokenPriceReturn {
  /** Price as raw output bigint for 1e18 units of tokenAddress. */
  price: bigint | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches the price of a token denominated in a quote token via Swappi V2.
 *
 * The returned `price` is the raw output amount for 1 whole token (1e18 units
 * of the input token). Divide by `10 ** quoteTokenDecimals` for a human-
 * readable price.
 *
 * @example
 * ```tsx
 * const { price } = useTokenPrice({ service, tokenAddress: '0x...', quoteToken: USDT_ADDRESS });
 * ```
 */
export function useTokenPrice(input: UseTokenPriceInput): UseTokenPriceReturn {
  const client = useClient();
  const { service, tokenAddress, quoteToken, refreshMs = 30_000, enabled = true } = input;

  const { data, isLoading, error } = useQuery<bigint, Error>({
    queryKey: ['cfx', 'token-price', client.chain.id, tokenAddress, quoteToken],
    enabled: enabled && !!tokenAddress,
    staleTime: refreshMs,
    refetchInterval: refreshMs,
    queryFn: () => service.getTokenPrice(tokenAddress as Address, quoteToken),
  });

  return { price: data, isLoading, error };
}
