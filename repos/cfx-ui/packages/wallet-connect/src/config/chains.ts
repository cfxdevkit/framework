import type { ChainConfig as FrameworkChainConfig } from '@cfxdevkit/core/chains';
import {
  espaceLocal as frameworkEspaceLocal,
  espaceMainnet as frameworkEspaceMainnet,
  espaceTestnet as frameworkEspaceTestnet,
} from '@cfxdevkit/core/chains';
import { type Chain, defineChain } from 'viem';

export interface CreateSupportedEspaceChainsOptions {
  localRpcUrl?: string;
}

function toViemChain(chain: FrameworkChainConfig, rpcUrls = chain.rpc.http): Chain {
  return defineChain({
    id: chain.id,
    name: chain.displayName,
    nativeCurrency: {
      name: 'Conflux',
      symbol: chain.nativeToken.symbol,
      decimals: chain.nativeToken.decimals,
    },
    rpcUrls: { default: { http: [...rpcUrls] } },
    ...(chain.explorer
      ? {
          blockExplorers: {
            default: { name: chain.explorer.name, url: chain.explorer.url },
          },
        }
      : {}),
    ...(chain.network !== 'mainnet' ? { testnet: true } : {}),
  });
}

export function createSupportedEspaceChains(
  options: CreateSupportedEspaceChainsOptions = {},
): readonly [Chain, Chain, Chain] {
  const localRpcUrls = options.localRpcUrl
    ? [options.localRpcUrl]
    : [...frameworkEspaceLocal.rpc.http];
  return [
    toViemChain(frameworkEspaceMainnet),
    toViemChain(frameworkEspaceTestnet),
    toViemChain(frameworkEspaceLocal, localRpcUrls),
  ] as const;
}

export const [espaceMainnet, espaceTestnet, espaceLocal] = createSupportedEspaceChains();
export const SUPPORTED_ESPACE_CHAINS = [espaceMainnet, espaceTestnet, espaceLocal] as const;
