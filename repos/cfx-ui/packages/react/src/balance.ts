import type { Address, Wei } from '@cfxdevkit/cdk/types';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { decodeFunctionResult, encodeFunctionData } from 'viem';
import { useClient } from './context.js';

// Minimal ABI for ERC-20 balanceOf and decimals/symbol/name
const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const ERC20_METADATA_ABI = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

// ── useNativeBalance ──────────────────────────────────────────────────────────

export interface UseNativeBalanceInput {
  address: Address | null | undefined;
  enabled?: boolean;
  staleTimeMs?: number;
}

export interface UseNativeBalanceReturn {
  data: Wei | undefined;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Fetches the native CFX balance for `address`.
 * Returns `undefined` while loading or when `address` is nullish.
 */
export function useNativeBalance(input: UseNativeBalanceInput): UseNativeBalanceReturn {
  const client = useClient();
  const { address, enabled = true, staleTimeMs } = input;

  const options: UseQueryOptions<Wei, Error> = {
    queryKey: ['cfx', 'nativeBalance', client.chain.id, address],
    enabled: enabled && !!address,
    ...(staleTimeMs !== undefined ? { staleTime: staleTimeMs } : {}),
    queryFn: async () => {
      return client.getBalance(address as Address);
    },
  };

  const { data, error, isLoading, refetch } = useQuery(options);

  return { data, error, isLoading, refetch };
}

// ── useTokenBalance ───────────────────────────────────────────────────────────

export interface UseTokenBalanceInput {
  token: Address;
  owner: Address | null | undefined;
  enabled?: boolean;
  staleTimeMs?: number;
}

export interface UseTokenBalanceReturn {
  data: Wei | undefined;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Fetches the ERC-20 balance of `owner` for the token at `token`.
 */
export function useTokenBalance(input: UseTokenBalanceInput): UseTokenBalanceReturn {
  const client = useClient();
  const { token, owner, enabled = true, staleTimeMs } = input;

  const options: UseQueryOptions<Wei, Error> = {
    queryKey: ['cfx', 'tokenBalance', client.chain.id, token, owner],
    enabled: enabled && !!owner,
    ...(staleTimeMs !== undefined ? { staleTime: staleTimeMs } : {}),
    queryFn: async () => {
      const calldata = encodeFunctionData({
        abi: ERC20_BALANCE_ABI,
        functionName: 'balanceOf',
        args: [owner as Address],
      });
      const raw = await client.request<`0x${string}`>({
        method: 'eth_call',
        params: [{ to: token, data: calldata }, 'latest'],
      });
      const result = decodeFunctionResult({
        abi: ERC20_BALANCE_ABI,
        functionName: 'balanceOf',
        data: raw,
      });
      return result as Wei;
    },
  };

  const { data, error, isLoading, refetch } = useQuery(options);

  return { data, error, isLoading, refetch };
}

// ── useTokenMetadata ──────────────────────────────────────────────────────────

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
}

export interface UseTokenMetadataInput {
  token: Address | null | undefined;
  enabled?: boolean;
}

export interface UseTokenMetadataReturn {
  data: TokenMetadata | undefined;
  error: Error | null;
  isLoading: boolean;
}

async function readString(
  client: ReturnType<typeof useClient>,
  token: Address,
  functionName: 'name' | 'symbol',
): Promise<string> {
  const abi = ERC20_METADATA_ABI;
  const calldata = encodeFunctionData({ abi, functionName, args: [] });
  const raw = await client.request<`0x${string}`>({
    method: 'eth_call',
    params: [{ to: token, data: calldata }, 'latest'],
  });
  return decodeFunctionResult({ abi, functionName, data: raw }) as string;
}

async function readDecimals(client: ReturnType<typeof useClient>, token: Address): Promise<number> {
  const abi = ERC20_METADATA_ABI;
  const calldata = encodeFunctionData({ abi, functionName: 'decimals', args: [] });
  const raw = await client.request<`0x${string}`>({
    method: 'eth_call',
    params: [{ to: token, data: calldata }, 'latest'],
  });
  return Number(decodeFunctionResult({ abi, functionName: 'decimals', data: raw }));
}

/**
 * Fetches `name`, `symbol`, and `decimals` for an ERC-20 token.
 * Results are cached indefinitely (no staleTime) since token metadata never changes.
 */
export function useTokenMetadata(input: UseTokenMetadataInput): UseTokenMetadataReturn {
  const client = useClient();
  const { token, enabled = true } = input;

  const { data, error, isLoading } = useQuery({
    queryKey: ['cfx', 'tokenMetadata', client.chain.id, token],
    enabled: enabled && !!token,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      const t = token as Address;
      const [name, symbol, decimals] = await Promise.all([
        readString(client, t, 'name'),
        readString(client, t, 'symbol'),
        readDecimals(client, t),
      ]);
      return { name, symbol, decimals } satisfies TokenMetadata;
    },
  });

  return { data, error, isLoading };
}
