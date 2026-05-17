import {
  type CasHexAddress,
  type CasPoolsResponse,
  type CasTokenInfo,
  ZERO_ADDRESS,
} from '@cfxdevkit/cas-shared';
import { MAINNET_AUTOMATION_MANAGER_ADDRESS, MAINNET_WCFX_ADDRESS } from './deployments';
import { readTargetEspaceChain } from './ethereum';

export const CFX_NATIVE_ADDRESS = ZERO_ADDRESS;

// ── Token types ───────────────────────────────────────────────────────────────

export interface TokenWithBalance extends CasTokenInfo {
  balanceWei?: string;
  balanceFormatted?: string;
}

export interface StrategyContracts {
  automationManagerAddress: CasHexAddress;
  wcfxAddress: CasHexAddress;
  rpcUrl: string;
}

// ── Draft / step types ────────────────────────────────────────────────────────

export interface StrategyDraft {
  kind: 'limit_order' | 'dca';
  tokenIn: CasHexAddress;
  tokenOut: CasHexAddress;
  amountIn: string;
  targetPrice: string;
  direction: 'gte' | 'lte';
  amountPerSwap: string;
  intervalSeconds: number;
  totalSwaps: number;
  slippageBps: number;
  expiryDays: number;
  unlimitedApproval: boolean;
}

export type StrategyStepStatus = 'idle' | 'active' | 'waiting' | 'done' | 'skipped' | 'error';

export interface StrategyStep {
  id: 'wrap' | 'approve' | 'onchain' | 'save';
  label: string;
  detail: string;
  status: StrategyStepStatus;
  txHash?: `0x${string}`;
}

// ── Initializers ──────────────────────────────────────────────────────────────

export function createInitialStrategyDraft(): StrategyDraft {
  return {
    kind: 'limit_order',
    tokenIn: CFX_NATIVE_ADDRESS,
    tokenOut: CFX_NATIVE_ADDRESS,
    amountIn: '',
    targetPrice: '',
    direction: 'gte',
    amountPerSwap: '',
    intervalSeconds: 300,
    totalSwaps: 10,
    slippageBps: 50,
    expiryDays: 7,
    unlimitedApproval: false,
  };
}

export function buildStrategySteps(
  needsWrap: boolean,
  kind: StrategyDraft['kind'],
  tokenSymbol: string,
): StrategyStep[] {
  const steps: StrategyStep[] = [];
  if (needsWrap) steps.push({ id: 'wrap', label: 'Wrap CFX', detail: 'Pending', status: 'idle' });
  steps.push(
    { id: 'approve', label: `Approve ${tokenSymbol}`, detail: 'Pending', status: 'idle' },
    {
      id: 'onchain',
      label: kind === 'dca' ? 'Register DCA' : 'Register limit order',
      detail: 'Pending',
      status: 'idle',
    },
    { id: 'save', label: 'Save strategy', detail: 'Pending', status: 'idle' },
  );
  return steps;
}

// ── Pool helpers ──────────────────────────────────────────────────────────────

export function pairedTokens(
  pools: CasPoolsResponse,
  tokens: TokenWithBalance[],
  tokenIn: CasHexAddress,
  wcfxAddress: CasHexAddress,
): TokenWithBalance[] {
  const resolvedTokenIn = resolveTokenInAddress(tokenIn, wcfxAddress).toLowerCase();
  const paired = new Set<string>();
  for (const pair of pools.pairs) {
    const t0 = pair.token0.toLowerCase();
    const t1 = pair.token1.toLowerCase();
    if (t0 === resolvedTokenIn) paired.add(t1);
    if (t1 === resolvedTokenIn) paired.add(t0);
  }
  const options = tokens.filter((t) =>
    paired.has(resolveTokenInAddress(t.address, wcfxAddress).toLowerCase()),
  );
  return options.length > 0 ? options : tokens.filter((t) => t.address !== tokenIn);
}

export function resolveTokenInAddress(
  token: CasHexAddress,
  wcfxAddress: CasHexAddress,
): CasHexAddress {
  return token.toLowerCase() === CFX_NATIVE_ADDRESS.toLowerCase() ? wcfxAddress : token;
}

export function tokenDecimals(token: CasTokenInfo | undefined): number {
  return token?.decimals ?? 18;
}

// ── Inline committed-amount helper (used by StrategyBuilder) ─────────────────

import type { CasJobDto } from '@cfxdevkit/cas-shared';

export function readExistingCommitted(jobs: CasJobDto[], tokenIn: CasHexAddress): bigint {
  const terminal = new Set(['executed', 'cancelled', 'failed', 'expired']);
  let committed = 0n;
  for (const job of jobs) {
    if (terminal.has(job.status)) continue;
    const params = job.params as Record<string, unknown>;
    if (String(params.tokenIn ?? '').toLowerCase() !== tokenIn.toLowerCase()) continue;
    if (job.type === 'limit_order') committed += BigInt(String(params.amountIn ?? '0'));
    if (job.type === 'dca') {
      const amountPerSwap = BigInt(String(params.amountPerSwap ?? '0'));
      const totalSwaps = Number(params.totalSwaps ?? 0);
      const swapsCompleted = Number(params.swapsCompleted ?? 0);
      committed += amountPerSwap * BigInt(Math.max(0, totalSwaps - swapsCompleted));
    }
  }
  return committed;
}

// ── Contract reader ───────────────────────────────────────────────────────────

export function readContracts(): StrategyContracts {
  const saved = typeof window !== 'undefined' ? window.localStorage.getItem('cas.contracts') : null;
  const defaults: StrategyContracts = {
    automationManagerAddress: readEnvAddress(
      process.env.NEXT_PUBLIC_AUTOMATION_MANAGER_ADDRESS,
      MAINNET_AUTOMATION_MANAGER_ADDRESS,
    ),
    wcfxAddress: readEnvAddress(process.env.NEXT_PUBLIC_WCFX_ADDRESS, MAINNET_WCFX_ADDRESS),
    rpcUrl: process.env.NEXT_PUBLIC_CONFLUX_ESPACE_RPC ?? readTargetEspaceChain().rpcUrl,
  };
  if (saved) {
    try {
      return { ...defaults, ...(JSON.parse(saved) as Partial<StrategyContracts>) };
    } catch {
      /* ignore malformed storage */
    }
  }
  return defaults;
}

function readEnvAddress(value: string | undefined, fallback: CasHexAddress): CasHexAddress {
  return value?.startsWith('0x') ? (value as CasHexAddress) : fallback;
}
