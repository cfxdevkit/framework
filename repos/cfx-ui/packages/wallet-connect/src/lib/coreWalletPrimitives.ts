import { coreSpaceLocal, coreSpaceMainnet, coreSpaceTestnet } from '@cfxdevkit/core/chains';
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

function toCoreChainConfig(chain: {
  id: number;
  displayName: string;
  rpc: { http: readonly string[] };
  explorer?: { url: string };
}): CoreChainConfig {
  return {
    coreChainId: chain.id,
    chainIdHex: toHex(chain.id),
    label: chain.displayName,
    rpcUrl: chain.rpc.http[0] ?? '',
    rpcUrls: [...chain.rpc.http],
    ...(chain.explorer ? { blockExplorerUrl: chain.explorer.url } : {}),
  };
}

export const CORE_CHAIN_CONFIGS: Record<number, CoreChainConfig> = {
  [coreSpaceTestnet.id]: toCoreChainConfig(coreSpaceTestnet),
  [coreSpaceMainnet.id]: toCoreChainConfig(coreSpaceMainnet),
  [coreSpaceLocal.id]: toCoreChainConfig(coreSpaceLocal),
};

export function normalizeCoreChainId(raw: string): string {
  if (!raw || raw === '0xNaN') return raw;
  const numeric = Number(raw);
  if (!Number.isNaN(numeric) && numeric > 0) return toHex(numeric);
  return raw.toLowerCase();
}

export function getFluentCoreProvider(): FluentProvider | null {
  if (typeof window === 'undefined') return null;
  const candidate = window as Window & { conflux?: FluentProvider };
  return candidate.conflux?.isFluent ? candidate.conflux : null;
}

export function getCoreChainConfig(chainIdHex: string): CoreChainConfig | null {
  const target = chainIdHex.toLowerCase();
  return Object.values(CORE_CHAIN_CONFIGS).find((chain) => chain.chainIdHex === target) ?? null;
}

export function buildAddChainParams(
  target: CoreChainConfig,
  rpcUrl = target.rpcUrl,
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
  let delayMs = 50;
  while (Date.now() < deadline) {
    const provider = getFluentCoreProvider();
    if (provider) return provider;
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    delayMs = Math.min(delayMs * 2, 500);
  }
  return getFluentCoreProvider();
}

export async function rpcCoreChainId(provider: FluentProvider): Promise<string | null> {
  try {
    const chainId = (await provider.request({ method: 'cfx_chainId' })) as string;
    if (!chainId || chainId === '0xNaN') return null;
    return normalizeCoreChainId(chainId);
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
  } catch (switchError) {
    const code = (switchError as { code?: number }).code;
    if (code === 4001) throw switchError;
    if (code !== 4902 && code !== -32603) throw switchError;

    let added = false;
    for (const rpcUrl of addParams.rpcUrls) {
      try {
        await provider.request({
          method: 'wallet_addConfluxChain',
          params: [{ ...addParams, rpcUrls: [rpcUrl] }],
        });
        added = true;
        break;
      } catch (addError) {
        if ((addError as { code?: number }).code === 4001) throw addError;
      }
    }

    if (!added) throw switchError;
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
      const chainId = await rpcCoreChainId(provider);
      if (chainId === target) {
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

export function formatProviderError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { message?: string };
    if (candidate.message) return candidate.message;
  }
  return String(error);
}
