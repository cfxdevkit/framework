import type { Hash, TxReceipt, Wei } from '@cfxdevkit/cdk/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useClient, useSigner } from './context.js';

// ── useSendTransaction ────────────────────────────────────────────────────────

export interface SendTransactionInput {
  to: `0x${string}`;
  data?: `0x${string}`;
  value?: Wei;
  /** Gas limit override. If omitted, estimated automatically. */
  gas?: bigint;
}

export interface SendTransactionResult {
  hash: Hash;
}

export interface UseSendTransactionReturn {
  sendAsync: (input: SendTransactionInput) => Promise<SendTransactionResult>;
  isPending: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Submits a raw transaction via the connected signer.
 * Throws if no signer is available (read-only session).
 */
export function useSendTransaction(): UseSendTransactionReturn {
  const client = useClient();
  const signer = useSigner();

  const { mutateAsync, isPending, error, reset } = useMutation({
    mutationFn: async (input: SendTransactionInput) => {
      if (!signer) {
        throw new Error('No signer available. Provide a signer to <CfxProvider>.');
      }

      const [nonce, gasPrice] = await Promise.all([
        client.request<`0x${string}`>({
          method: 'eth_getTransactionCount',
          params: [signer.address, 'latest'],
        }),
        client.request<`0x${string}`>({ method: 'eth_gasPrice', params: [] }),
      ]);

      const gas =
        input.gas ??
        (await client.request<`0x${string}`>({
          method: 'eth_estimateGas',
          params: [
            {
              from: signer.address,
              to: input.to,
              data: input.data,
              value: input.value ? `0x${input.value.toString(16)}` : undefined,
            },
          ],
        }));

      const signed = await signer.signTransaction({
        to: input.to,
        data: input.data,
        value: input.value ?? 0n,
        gas,
        nonce,
        gasPrice,
        chainId: client.chain.id,
      });

      const hash = await client.request<Hash>({
        method: 'eth_sendRawTransaction',
        params: [signed],
      });

      return { hash } satisfies SendTransactionResult;
    },
  });

  return { sendAsync: mutateAsync, isPending, error, reset };
}

// ── useWaitForTransaction ─────────────────────────────────────────────────────

export interface UseWaitForTransactionInput {
  hash: Hash | null | undefined;
  /** Poll interval in ms. Default: 2000. */
  pollIntervalMs?: number;
  enabled?: boolean;
}

export interface UseWaitForTransactionReturn {
  data: TxReceipt | undefined;
  error: Error | null;
  isLoading: boolean;
}

/**
 * Polls `eth_getTransactionReceipt` until the receipt is available.
 * Suspends the query while `hash` is null/undefined or `enabled` is false.
 */
export function useWaitForTransaction(
  input: UseWaitForTransactionInput,
): UseWaitForTransactionReturn {
  const client = useClient();
  const { hash, pollIntervalMs = 2_000, enabled = true } = input;

  const { data, error, isLoading } = useQuery({
    queryKey: ['cfx', 'txReceipt', client.chain.id, hash],
    enabled: enabled && !!hash,
    refetchInterval: (query) => (query.state.data ? false : pollIntervalMs),
    queryFn: async () => {
      if (!hash) return null;
      // Keep polling by returning null — TanStack Query will not set data until non-null
      const receipt = await client.request<TxReceipt | null>({
        method: 'eth_getTransactionReceipt',
        params: [hash],
      });
      if (!receipt) throw new Error('pending');
      return receipt;
    },
    retry: (failCount, err) => {
      if (err instanceof Error && err.message === 'pending') return true;
      return failCount < 3;
    },
    retryDelay: pollIntervalMs,
  });

  return { data: data ?? undefined, error, isLoading };
}
