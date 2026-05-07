import { toHex } from 'viem';

export interface FluentProvider {
  isFluent?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

export type WalletStatus = 'detecting' | 'not-installed' | 'not-active' | 'connecting' | 'active';

export interface CoreChainConfig {
  coreChainId: number;
  chainIdHex: string;
  label: string;
  rpcUrl: string;
  rpcUrls: string[];
  blockExplorerUrl?: string;
}

export interface ConfluxAddChainParams {
  chainId: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}

export function normalizeCoreChainId(raw: string): string {
  if (!raw || raw === '0xNaN') return raw;
  const num = Number(raw);
  if (!Number.isNaN(num) && num > 0) return toHex(num);
  return raw.toLowerCase();
}

export function getFluentCoreProvider(): FluentProvider | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as { conflux?: FluentProvider };
  return win.conflux?.isFluent ? win.conflux : null;
}

export const CORE_CHAIN_CONFIGS: Record<number, CoreChainConfig> = {
  1: {
    coreChainId: 1,
    chainIdHex: '0x1',
    label: 'Core Testnet',
    rpcUrl: 'https://test.confluxrpc.com',
    rpcUrls: ['https://test.confluxrpc.com'],
    blockExplorerUrl: 'https://testnet.confluxscan.org',
  },
  1029: {
    coreChainId: 1029,
    chainIdHex: '0x405',
    label: 'Core Mainnet',
    rpcUrl: 'https://main.confluxrpc.com',
    rpcUrls: ['https://main.confluxrpc.com'],
    blockExplorerUrl: 'https://confluxscan.org',
  },
  2029: {
    coreChainId: 2029,
    chainIdHex: '0x7ed',
    label: 'Core Local',
    rpcUrl: 'http://127.0.0.1:12537',
    rpcUrls: ['http://127.0.0.1:12537'],
  },
};

export function getCoreChainConfig(chainIdHex: string): CoreChainConfig | null {
  const target = chainIdHex.toLowerCase();
  return Object.values(CORE_CHAIN_CONFIGS).find((config) => config.chainIdHex === target) ?? null;
}

export function buildAddChainParams(
  target: CoreChainConfig,
  rpcUrl: string,
): ConfluxAddChainParams {
  return {
    chainId: target.chainIdHex,
    chainName: `Conflux ${target.label}`,
    nativeCurrency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
    rpcUrls: [rpcUrl],
    ...(target.blockExplorerUrl ? { blockExplorerUrls: [target.blockExplorerUrl] } : {}),
  };
}

export async function detectFluentCore(maxMs = 3_000): Promise<FluentProvider | null> {
  const deadline = Date.now() + maxMs;
  let delay = 50;
  while (Date.now() < deadline) {
    const provider = getFluentCoreProvider();
    if (provider) return provider;
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 2, 500);
  }
  return getFluentCoreProvider();
}

export async function rpcCoreChainId(provider: FluentProvider): Promise<string | null> {
  try {
    const id = (await provider.request({ method: 'cfx_chainId' })) as string;
    if (!id || id === '0xNaN') return null;
    return normalizeCoreChainId(id);
  } catch {
    return null;
  }
}

export async function rpcCoreAccounts(provider: FluentProvider): Promise<string[]> {
  try {
    const result = (await provider.request({ method: 'cfx_accounts' })) as string[];
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

export async function rpcRequestCoreAccounts(provider: FluentProvider): Promise<string[]> {
  const result = (await provider.request({ method: 'cfx_requestAccounts' })) as string[];
  return Array.isArray(result) ? result : [];
}

export async function switchConfluxChain(
  provider: FluentProvider,
  chainId: string,
  addParams: ConfluxAddChainParams,
): Promise<void> {
  try {
    await provider.request({ method: 'wallet_switchConfluxChain', params: [{ chainId }] });
  } catch (switchErr) {
    const code = (switchErr as { code?: number })?.code;
    if (code === 4001) throw switchErr;
    if (code !== 4902 && code !== -32603) throw switchErr;

    let added = false;
    for (const rpcUrl of addParams.rpcUrls) {
      try {
        await provider.request({
          method: 'wallet_addConfluxChain',
          params: [{ ...addParams, rpcUrls: [rpcUrl] }],
        });
        added = true;
        break;
      } catch (addErr) {
        if ((addErr as { code?: number })?.code === 4001) throw addErr;
      }
    }
    if (!added) throw switchErr;
    await provider.request({ method: 'wallet_switchConfluxChain', params: [{ chainId }] });
  }
}

export function waitForCoreChain(
  provider: FluentProvider,
  targetHex: string,
  maxMs = 10_000,
  pollIntervalMs = 300,
): Promise<boolean> {
  const target = targetHex.toLowerCase();
  return new Promise<boolean>((resolve) => {
    let done = false;
    let pollTimer: ReturnType<typeof setTimeout>;
    let timeoutTimer: ReturnType<typeof setTimeout>;

    const finish = (matched: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(pollTimer);
      clearTimeout(timeoutTimer);
      provider.removeListener('chainChanged', onChainChanged);
      resolve(matched);
    };

    const onChainChanged = (chainId: unknown) => {
      if (typeof chainId !== 'string') return;
      if (normalizeCoreChainId(chainId) === target) finish(true);
    };

    const poll = async () => {
      const id = await rpcCoreChainId(provider);
      if (id === target) {
        finish(true);
        return;
      }
      if (!done) pollTimer = setTimeout(poll, pollIntervalMs);
    };

    provider.on('chainChanged', onChainChanged);
    pollTimer = setTimeout(poll, pollIntervalMs);
    timeoutTimer = setTimeout(() => finish(false), maxMs);
  });
}

export function formatProviderError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const maybeError = err as { message?: string };
    if (maybeError.message) return maybeError.message;
  }
  return String(err);
}
