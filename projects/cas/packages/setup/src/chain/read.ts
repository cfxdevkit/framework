import { createPublicClient, http, type PublicClient } from 'viem';
import { automationManagerAbi } from '@cfxdevkit/protocol';

function makeViemChain(rpcUrl: string, chainId: number) {
  return {
    id: chainId,
    name: 'conflux-espace',
    nativeCurrency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] as const } },
  } as const;
}


async function getPublicClient(rpcUrl: string, networkChainId: number): Promise<PublicClient> {
  const chain = makeViemChain(rpcUrl, networkChainId);
  return createPublicClient({ chain, transport: http(rpcUrl) }) as unknown as PublicClient;
}

export async function isKeeper(
  rpcUrl: string,
  chainId: number,
  automationManagerAddress: string,
  signerAddress: string,
): Promise<boolean> {
  const client = await getPublicClient(rpcUrl, chainId);
  const result = await client.readContract({
    address: automationManagerAddress as `0x${string}`,
    abi: automationManagerAbi,
    functionName: 'keepers',
    args: [signerAddress as `0x${string}`],
  });
  return result as boolean;
}

export async function getBalance(
  rpcUrl: string,
  chainId: number,
  address: string,
): Promise<bigint> {
  const client = await getPublicClient(rpcUrl, chainId);
  return client.getBalance({ address: address as `0x${string}` });
}
