import type { CasPairInfo, CasPoolsResponse, CasTokenInfo } from '@cfxdevkit/cas-shared';
import { ZERO_ADDRESS } from '@cfxdevkit/core';
import { WCFX_ADDRESSES } from '@cfxdevkit/protocol';
import { createPublicClient, http } from 'viem';

const SWAPPI_TESTNET_FACTORY = '0x8d0d1c7c32d8a395c817B22Ff3BD6fFa2A7eBe08' as const;

const FACTORY_ABI = [
  {
    type: 'function',
    name: 'getPair',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
    ],
    outputs: [{ name: 'pair', type: 'address' }],
  },
] as const;

const TESTNET_TOKENS = [
  {
    address: WCFX_ADDRESSES.testnet as `0x${string}`,
    symbol: 'WCFX',
    name: 'Wrapped CFX',
    decimals: 18,
  },
  {
    address: '0x7d682e65efc5c13bf4e394b8f376c48e6bae0355',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 18,
  },
] as const satisfies readonly CasTokenInfo[];

export async function readFallbackPools(options: {
  network: 'testnet' | 'mainnet';
  rpcUrl: string;
}): Promise<CasPoolsResponse> {
  if (options.network === 'mainnet') return emptyPools();

  const tokens = TESTNET_TOKENS.map((token) => ({ ...token }));
  const [token0, token1] = tokens;
  if (!token0 || !token1) return { tokens, pairs: [], cachedAt: Date.now() };

  const pairAddress = await readSwappiPairAddress(options.rpcUrl, token0.address, token1.address);
  const pairs: CasPairInfo[] = pairAddress
    ? [{ address: pairAddress, token0: token0.address, token1: token1.address }]
    : [];

  return { tokens, pairs, cachedAt: Date.now() };
}

function emptyPools(): CasPoolsResponse {
  return { tokens: [], pairs: [], cachedAt: Date.now() };
}

async function readSwappiPairAddress(
  rpcUrl: string,
  token0: CasTokenInfo['address'],
  token1: CasTokenInfo['address'],
): Promise<CasPairInfo['address'] | null> {
  try {
    const client = createPublicClient({ transport: http(rpcUrl) });
    const address = await client.readContract({
      address: SWAPPI_TESTNET_FACTORY,
      abi: FACTORY_ABI,
      functionName: 'getPair',
      args: [token0, token1],
    });
    return address !== ZERO_ADDRESS ? (address.toLowerCase() as CasPairInfo['address']) : null;
  } catch {
    return null;
  }
}
