import { toHex } from 'viem';

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export interface EspaceChainConfig {
  chainId: number;
  chainIdHex: `0x${string}`;
  name: string;
  rpcUrl: string;
  explorerUrl?: string;
}

export const ESPACE_CHAINS: Record<'mainnet' | 'testnet' | 'local', EspaceChainConfig> = {
  mainnet: {
    chainId: 1030,
    chainIdHex: '0x406',
    name: 'Conflux eSpace Mainnet',
    rpcUrl: 'https://evm.confluxrpc.com',
    explorerUrl: 'https://evm.confluxscan.io',
  },
  testnet: {
    chainId: 71,
    chainIdHex: '0x47',
    name: 'Conflux eSpace Testnet',
    rpcUrl: 'https://evmtestnet.confluxrpc.com',
    explorerUrl: 'https://evmtestnet.confluxscan.io',
  },
  local: {
    chainId: 2030,
    chainIdHex: '0x7ee',
    name: 'Conflux eSpace Local',
    rpcUrl: 'http://127.0.0.1:8545',
  },
};

export function readEthereumProvider(): EthereumProvider {
  const candidate = window as Window & { ethereum?: EthereumProvider };
  if (!candidate.ethereum) throw new Error('No EVM browser wallet provider detected');
  return candidate.ethereum;
}

export async function requestWalletAccounts(
  provider = readEthereumProvider(),
): Promise<`0x${string}`[]> {
  const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
  return accounts.filter((account): account is `0x${string}` => account.startsWith('0x'));
}

export async function readWalletChainId(provider = readEthereumProvider()): Promise<number | null> {
  const chainId = (await provider.request({ method: 'eth_chainId' })) as string | undefined;
  if (!chainId) return null;
  return Number.parseInt(chainId, 16);
}

export async function switchOrAddEspaceChain(
  target: EspaceChainConfig,
  provider = readEthereumProvider(),
): Promise<void> {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: target.chainIdHex }],
    });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code !== 4902 && code !== -32603) throw error;
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: target.chainIdHex,
          chainName: target.name,
          nativeCurrency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
          rpcUrls: [target.rpcUrl],
          ...(target.explorerUrl ? { blockExplorerUrls: [target.explorerUrl] } : {}),
        },
      ],
    });
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: target.chainIdHex }],
    });
  }
}

export async function sendWalletTransaction(
  transaction: {
    from: `0x${string}`;
    to: `0x${string}`;
    data?: `0x${string}`;
    value?: bigint;
  },
  provider = readEthereumProvider(),
): Promise<`0x${string}`> {
  const hash = await provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: transaction.from,
        to: transaction.to,
        ...(transaction.data ? { data: transaction.data } : {}),
        ...(transaction.value !== undefined ? { value: toHex(transaction.value) } : {}),
      },
    ],
  });
  if (typeof hash !== 'string' || !hash.startsWith('0x'))
    throw new Error('Wallet did not return a transaction hash');
  return hash as `0x${string}`;
}

export function readWalletError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return String(error);
}
