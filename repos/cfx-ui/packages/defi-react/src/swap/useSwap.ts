import { ERC20_ABI } from '@cfxdevkit/abis';
import type { Address, Hash, Wei } from '@cfxdevkit/core/types';
import { useAccount } from '@cfxdevkit/react/account';
import { useClient } from '@cfxdevkit/react/context';
import { useReadContract, useWriteContract } from '@cfxdevkit/react/contract';
import { useSendTransaction, useWaitForTransaction } from '@cfxdevkit/react/tx';
import { CFX_NATIVE_ADDRESS, normalizeAddress } from '@cfxdevkit/ui-core';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { DexAdapter, Quote } from '../types.js';

const MAX_UINT256 = (1n << 256n) - 1n;

function isNativeToken(address: Address): boolean {
  return normalizeAddress(address) === normalizeAddress(CFX_NATIVE_ADDRESS);
}

function isSetAddress(address: Address): boolean {
  return address.length === 42;
}

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
  approveAsync: () => Promise<{ hash: Hash }>;
  needsApproval: boolean;
  isApproving: boolean;
  approvalError: Error | null;
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
  const { address } = useAccount();
  const {
    adapter,
    tokenIn,
    tokenOut,
    amountIn,
    slippageBps = 50,
    deadlineMs = 60_000,
    enabled = true,
  } = input;
  const [approvalHash, setApprovalHash] = useState<Hash | null>(null);
  const canReadSwap = enabled && isSetAddress(tokenIn) && isSetAddress(tokenOut);
  const nativeIn = isNativeToken(tokenIn);
  const spenderAddress = adapter.getSpenderAddress?.();

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
    enabled: canReadSwap && amountIn > 0n,
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

  const {
    data: allowance,
    error: allowanceError,
    refetch: refetchAllowance,
  } = useReadContract<bigint>({
    address: tokenIn,
    abi: ERC20_ABI,
    functionName: 'allowance',
    ...(address && spenderAddress ? { args: [address, spenderAddress] as const } : {}),
    enabled: canReadSwap && !nativeIn && !!address && !!spenderAddress && amountIn > 0n,
    staleTimeMs: 15_000,
  });

  const { sendAsync } = useSendTransaction();
  const { writeAsync: writeContractAsync } = useWriteContract();
  const {
    data: approvalReceipt,
    error: approvalReceiptError,
    isLoading: isApprovalReceiptPending,
  } = useWaitForTransaction({
    hash: approvalHash,
    enabled: approvalHash !== null,
    pollIntervalMs: 2_000,
  });

  useEffect(() => {
    if (!approvalReceipt) return;
    refetchAllowance();
    setApprovalHash(null);
  }, [approvalReceipt, refetchAllowance]);

  const needsApproval =
    canReadSwap &&
    amountIn > 0n &&
    !nativeIn &&
    !!address &&
    !!spenderAddress &&
    (allowance ?? 0n) < amountIn;

  const {
    mutateAsync: approveMutate,
    isPending: isApproveSubmitting,
    error: approveError,
    reset: resetApprove,
  } = useMutation({
    mutationFn: async () => {
      if (nativeIn) {
        throw new Error('Native CFX swaps do not require token approval.');
      }
      if (!address) {
        throw new Error('Connect a wallet before approving tokens.');
      }
      if (!spenderAddress) {
        throw new Error('Swap adapter does not expose a token spender address.');
      }

      const result = await writeContractAsync({
        address: tokenIn,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, MAX_UINT256],
      });

      setApprovalHash(result.hash);
      return result;
    },
  });

  const {
    mutateAsync: swapMutate,
    isPending: isSwapping,
    error: swapError,
    reset,
  } = useMutation({
    mutationFn: async () => {
      if (!quote) throw new Error('No quote available. Wait for quote to load before swapping.');
      if (!address) throw new Error('Connect a wallet before swapping.');
      if (needsApproval) {
        throw new Error('Approve the input token before submitting the swap.');
      }

      const calldata = await adapter.buildCalldata(quote, { recipient: address });
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
    approveAsync: approveMutate,
    needsApproval,
    isApproving: isApproveSubmitting || isApprovalReceiptPending,
    approvalError: (approveError as Error | null) ?? allowanceError ?? approvalReceiptError,
    swapAsync: swapMutate,
    isSwapping,
    swapError,
    reset: () => {
      reset();
      resetApprove();
      setApprovalHash(null);
    },
  };
}
