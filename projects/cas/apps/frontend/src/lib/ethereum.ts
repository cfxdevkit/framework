import type { ChainConfig } from '@cfxdevkit/cdk/chains';
import { espaceLocal, espaceMainnet, espaceTestnet } from '@cfxdevkit/cdk/chains';
import { toHex } from 'viem';
import { DEFAULT_CAS_NETWORK } from './deployments';

export type CasNetwork = 'mainnet' | 'testnet' | 'local';

export interface EspaceChainConfig {
  chainId: number;
  chainIdHex: `0x${string}`;
  name: string;
  rpcUrl: string;
  explorerUrl?: string;
}

export const ESPACE_CHAINS: Record<CasNetwork, EspaceChainConfig> = {
  mainnet: toEspaceChainConfig(espaceMainnet),
  testnet: toEspaceChainConfig(espaceTestnet),
  local: toEspaceChainConfig(espaceLocal),
};

export function readCasNetwork(): CasNetwork {
  const configured = process.env.NEXT_PUBLIC_CAS_NETWORK;
  if (configured === 'mainnet' || configured === 'local') return configured;
  if (configured === 'testnet') return configured;
  return DEFAULT_CAS_NETWORK;
}

export function readTargetEspaceChain(): EspaceChainConfig {
  return ESPACE_CHAINS[readCasNetwork()];
}

function toEspaceChainConfig(chain: ChainConfig): EspaceChainConfig {
  const rpcUrl = chain.rpc.http[0];
  if (!rpcUrl) throw new Error(`Missing HTTP RPC endpoint for ${chain.name}`);
  return {
    chainId: chain.id,
    chainIdHex: toHex(chain.id),
    name: chain.displayName,
    rpcUrl,
    ...(chain.explorer?.url ? { explorerUrl: chain.explorer.url } : {}),
  };
}
