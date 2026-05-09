import type { Address, BlockTag, Hash, Wei } from '@cfxdevkit/core/types';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Abi } from 'viem';
import { decodeFunctionResult, encodeFunctionData } from 'viem';
import { useClient, useSigner } from './context.js';

// ── Shared types ─────────────────────────────────────────────────────────────

export interface ContractError extends Error {
  readonly cause?: unknown;
}

export interface ReadCall {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
}

export interface WriteInput {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  value?: Wei;
}

// ── useReadContract ───────────────────────────────────────────────────────────

export interface UseReadContractInput {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  blockTag?: BlockTag;
  enabled?: boolean;
  staleTimeMs?: number;
}

export interface UseReadContractReturn<T> {
  data: T | undefined;
  error: ContractError | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useReadContract<T = unknown>(
  input: UseReadContractInput,
): UseReadContractReturn<T> {
  const client = useClient();
  const { address, abi, functionName, args, enabled = true, staleTimeMs } = input;

  const options: UseQueryOptions<T, Error> = {
    queryKey: ['cfx', 'readContract', client.chain.id, address, functionName, args],
    enabled,
    ...(staleTimeMs !== undefined ? { staleTime: staleTimeMs } : {}),
    queryFn: async () => {
      const calldata = encodeFunctionData({ abi, functionName, args: args as never[] });
      const result = await client.request<`0x${string}`>({
        method: 'eth_call',
        params: [{ to: address, data: calldata }, 'latest'],
      });
      return decodeFunctionResult({ abi, functionName, data: result }) as T;
    },
  };

  const { data, error, isLoading, refetch } = useQuery(options);

  return { data, error: error as ContractError | null, isLoading, refetch };
}

// ── useReadContracts ──────────────────────────────────────────────────────────

export interface UseReadContractsInput {
  calls: readonly ReadCall[];
  enabled?: boolean;
  staleTimeMs?: number;
}

export interface UseReadContractsReturn {
  data: Array<{ status: 'success' | 'failure'; result: unknown }> | undefined;
  error: ContractError | null;
  isLoading: boolean;
}

export function useReadContracts(input: UseReadContractsInput): UseReadContractsReturn {
  const client = useClient();
  const { calls, enabled = true, staleTimeMs } = input;

  type ResultItem = { status: 'success' | 'failure'; result: unknown };
  const options: UseQueryOptions<ResultItem[], Error> = {
    queryKey: ['cfx', 'readContracts', client.chain.id, calls],
    enabled,
    ...(staleTimeMs !== undefined ? { staleTime: staleTimeMs } : {}),
    queryFn: async () => {
      return Promise.all(
        calls.map(async (call) => {
          try {
            const calldata = encodeFunctionData({
              abi: call.abi,
              functionName: call.functionName,
              args: call.args as never[],
            });
            const raw = await client.request<`0x${string}`>({
              method: 'eth_call',
              params: [{ to: call.address, data: calldata }, 'latest'],
            });
            const result = decodeFunctionResult({
              abi: call.abi,
              functionName: call.functionName,
              data: raw,
            });
            return { status: 'success' as const, result };
          } catch (e) {
            return { status: 'failure' as const, result: e };
          }
        }),
      );
    },
  };

  const { data, error, isLoading } = useQuery(options);

  return { data, error: error as ContractError | null, isLoading };
}

// ── useSimulateContract ───────────────────────────────────────────────────────

export interface UseSimulateContractInput {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  value?: Wei;
  enabled?: boolean;
}

export interface UseSimulateContractReturn<T> {
  data: { result: T; request: WriteInput } | undefined;
  error: ContractError | null;
  isLoading: boolean;
}

export function useSimulateContract<T = unknown>(
  input: UseSimulateContractInput,
): UseSimulateContractReturn<T> {
  const client = useClient();
  const signer = useSigner();
  const { address, abi, functionName, args, value, enabled = true } = input;

  type SimResult = { result: T; request: WriteInput };
  const options: UseQueryOptions<SimResult, Error> = {
    queryKey: [
      'cfx',
      'simulateContract',
      client.chain.id,
      address,
      functionName,
      args,
      value?.toString(),
    ],
    enabled,
    queryFn: async () => {
      const calldata = encodeFunctionData({ abi, functionName, args: args as never[] });
      const raw = await client.request<`0x${string}`>({
        method: 'eth_call',
        params: [
          {
            from: signer?.address,
            to: address,
            data: calldata,
            ...(value !== undefined ? { value: `0x${value.toString(16)}` } : {}),
          },
          'latest',
        ],
      });
      const result = decodeFunctionResult({ abi, functionName, data: raw }) as T;
      const request: WriteInput = {
        address,
        abi,
        functionName,
        ...(args !== undefined ? { args } : {}),
        ...(value !== undefined ? { value } : {}),
      };
      return { result, request };
    },
  };

  const { data, error, isLoading } = useQuery(options);

  return { data, error: error as ContractError | null, isLoading };
}

// ── useWriteContract ──────────────────────────────────────────────────────────

export interface UseWriteContractReturn {
  writeAsync: (input: WriteInput) => Promise<{ hash: Hash }>;
  isPending: boolean;
  error: ContractError | null;
  reset: () => void;
}

export function useWriteContract(): UseWriteContractReturn {
  const client = useClient();
  const signer = useSigner();

  const { mutateAsync, isPending, error, reset } = useMutation({
    mutationFn: async (input: WriteInput) => {
      if (!signer) throw new Error('No signer available. Provide a signer to <CfxProvider>.');
      const calldata = encodeFunctionData({
        abi: input.abi,
        functionName: input.functionName,
        args: input.args as never[],
      });
      const valueHex = input.value ? (`0x${input.value.toString(16)}` as `0x${string}`) : undefined;
      const [gas, nonce, gasPrice] = await Promise.all([
        client.request<`0x${string}`>({
          method: 'eth_estimateGas',
          params: [
            {
              from: signer.address,
              to: input.address,
              data: calldata,
              ...(valueHex ? { value: valueHex } : {}),
            },
          ],
        }),
        client.request<`0x${string}`>({
          method: 'eth_getTransactionCount',
          params: [signer.address, 'latest'],
        }),
        client.request<`0x${string}`>({ method: 'eth_gasPrice', params: [] }),
      ]);
      const signed = await signer.signTransaction({
        to: input.address,
        data: calldata,
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
      return { hash };
    },
  });

  return {
    writeAsync: mutateAsync,
    isPending,
    error: error as ContractError | null,
    reset,
  };
}
