import type { Address, Hash, Wei } from '@cfxdevkit/core/types';
import { useClient } from '@cfxdevkit/react/context';
import { useSendTransaction } from '@cfxdevkit/react/tx';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { DexAdapter, Quote } from '../types.js';

export interface UseSwapInput {
  adapter: DexAdapter;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: Wei;
  /** Slippage tolerance in basis points. Default: 50 (0.5%). */
  slippageBps?: number;
  /** Tx deadline in ms from now. Default: 60_000. */
  deadlineMs?: number;
  enabled?: boolean;
}

export interface UseSwapReturn {
  quote: Quote | undefined;
  isQuoting: boolean;
  quoteError: Error | null;
  swapAsync: () => Promise<{ hash: Hash }>;
  isSwapping: boolean;
  swapError: Error | null;
  reset: () => void;
}

/**
 * Fetches a swap quote and provides a `swapAsync` function that encodes
 * and submits the swap transaction via the connected signer.
 *
 * Consumers supply a `DexAdapter` — this hook has no knowledge of any
 * specific DEX protocol.
 */
export function useSwap(input: UseSwapInput): UseSwapReturn {
  const client = useClient();
  const {
    adapter,
    tokenIn,
    tokenOut,
    amountIn,
    slippageBps = 50,
    deadlineMs = 60_000,
    enabled = true,
  } = input;

  // Quote query — re-runs when any input changes
  const {
    data: quote,
    isLoading: isQuoting,
    error: quoteError,
  } = useQuery({
    queryKey: [
      'cfx',
      'swap-quote',
      client.chain.id,
      tokenIn,
      tokenOut,
      amountIn.toString(),
      slippageBps,
    ],
    enabled: enabled && amountIn > 0n,
    refetchInterval: 15_000, // refresh quote every 15s
    queryFn: () =>
      adapter.getQuote({
        tokenIn,
        tokenOut,
        amountIn,
        slippageBps,
        deadlineMs: Date.now() + deadlineMs,
      }),
  });

  const { sendAsync } = useSendTransaction();

  const {
    mutateAsync: swapMutate,
    isPending: isSwapping,
    error: swapError,
    reset,
  } = useMutation({
    mutationFn: async () => {
      if (!quote) throw new Error('No quote available. Wait for quote to load before swapping.');
      const calldata = await adapter.buildCalldata(quote);
      return sendAsync({
        to: calldata.to,
        data: calldata.data,
        ...(calldata.value ? { value: calldata.value } : {}),
      });
    },
  });

  return {
    quote,
    isQuoting,
    quoteError,
    swapAsync: swapMutate,
    isSwapping,
    swapError,
    reset,
  };
}
