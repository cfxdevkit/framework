import { toHex } from 'viem';

export interface FluentProvider {
  isFluent?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

export function normalizeChainId(raw: string): string {
  if (!raw || raw === '0xNaN') return raw;
  const num = Number(raw);
  if (!Number.isNaN(num) && num > 0) return toHex(num);
  return raw.toLowerCase();
}

export function getFluentProvider(): FluentProvider | null {
  const w = window as unknown as { conflux?: FluentProvider };
  return w.conflux?.isFluent ? w.conflux : null;
}

export async function detectFluent(maxMs = 3_000): Promise<FluentProvider | null> {
  const deadline = Date.now() + maxMs;
  let delay = 50;
  while (Date.now() < deadline) {
    const p = getFluentProvider();
    if (p) return p;
    await new Promise<void>((r) => setTimeout(r, delay));
    delay = Math.min(delay * 2, 500);
  }
  return getFluentProvider();
}

export async function rpcChainId(p: FluentProvider): Promise<string | null> {
  try {
    const id = (await p.request({ method: 'cfx_chainId' })) as string;
    if (!id || id === '0xNaN') return null;
    return normalizeChainId(id);
  } catch {
    return null;
  }
}

export async function rpcAccounts(p: FluentProvider): Promise<string[]> {
  try {
    const result = (await p.request({ method: 'cfx_accounts' })) as string[];
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

export async function rpcRequestAccounts(p: FluentProvider): Promise<string[]> {
  const result = (await p.request({ method: 'cfx_requestAccounts' })) as string[];
  return Array.isArray(result) ? result : [];
}

export interface ConfluxAddChainParams {
  chainId: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}

export async function switchConfluxChain(
  p: FluentProvider,
  chainId: string,
  addParams: ConfluxAddChainParams,
): Promise<void> {
  try {
    await p.request({ method: 'wallet_switchConfluxChain', params: [{ chainId }] });
  } catch (switchErr) {
    const code = (switchErr as { code?: number })?.code;
    if (code === 4001) throw switchErr;

    if (code === 4902 || code === -32603) {
      let added = false;
      for (const rpcUrl of addParams.rpcUrls) {
        try {
          await p.request({
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
      await p.request({ method: 'wallet_switchConfluxChain', params: [{ chainId }] });
    } else {
      throw switchErr;
    }
  }
}

export function waitForChain(
  p: FluentProvider,
  targetHex: string,
  maxMs = 10_000,
  pollIntervalMs = 300,
): Promise<boolean> {
  const target = targetHex.toLowerCase();
  return new Promise<boolean>((resolve) => {
    let done = false;
    let pollTimer: ReturnType<typeof setTimeout>;

    const finish = (matched: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(pollTimer);
      p.removeListener('chainChanged', onChainChanged);
      resolve(matched);
    };

    const onChainChanged = (chainId: unknown) => {
      if (typeof chainId !== 'string') return;
      if (normalizeChainId(chainId) === target) finish(true);
    };

    p.on('chainChanged', onChainChanged);

    const poll = async () => {
      const id = await rpcChainId(p);
      if (id === target) {
        finish(true);
        return;
      }
      if (!done) pollTimer = setTimeout(poll, pollIntervalMs);
    };
    pollTimer = setTimeout(poll, pollIntervalMs);

    setTimeout(() => finish(false), maxMs);
  });
}

export function formatProviderError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const e = err as { message?: string };
    if (e.message) return e.message;
  }
  return String(err);
}

export interface CoreChainConfig {
  coreChainId: number;
  chainIdHex: string;
  label: string;
  rpcUrl: string;
  rpcUrls: string[];
  blockExplorerUrl?: string;
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
};

export function getCoreChainConfig(chainIdHex: string): CoreChainConfig | null {
  const target = chainIdHex.toLowerCase();
  return Object.values(CORE_CHAIN_CONFIGS).find((c) => c.chainIdHex === target) ?? null;
}

export type WalletStatus = 'detecting' | 'not-installed' | 'not-active' | 'connecting' | 'active';
