/**
 * On-chain transaction logic for creating CAS automation strategies.
 * Accepts wagmi-compatible publicClient and writeContractAsync functions
 * instead of raw EIP-1193 wallet providers.
 */

import {
  AUTOMATION_MANAGER_ABI,
  type CasCreateJobRequest,
  type CasHexAddress,
  ERC20_ABI,
  MAX_UINT256,
  WCFX_ABI,
  ZERO_ADDRESS,
} from '@cfxdevkit/cas-shared';
import { decodeEventLog, formatUnits, parseUnits } from 'viem';
import type {
  StrategyContracts,
  StrategyDraft,
  StrategyStep,
  StrategyStepStatus,
  TokenWithBalance,
} from '../strategy';
import { resolveTokenInAddress, tokenDecimals } from '../strategy';

// ── Narrow types for wagmi interop ────────────────────────────────────────────

export interface WagmiPublicClient {
  getBalance: (args: { address: `0x${string}` }) => Promise<bigint>;
  readContract: (args: {
    address: `0x${string}`;
    abi: readonly object[];
    functionName: string;
    args?: readonly unknown[];
  }) => Promise<unknown>;
  waitForTransactionReceipt: (args: {
    hash: `0x${string}`;
    pollingInterval?: number;
    timeout?: number;
  }) => Promise<{ logs: Array<{ topics: readonly `0x${string}`[]; data: `0x${string}` }> }>;
}

export type WriteContractFn = (args: {
  address: `0x${string}`;
  abi: readonly object[];
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
}) => Promise<`0x${string}`>;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatTokenAmount(value: bigint, decimals = 18): string {
  const n = Number(formatUnits(value, decimals));
  if (!Number.isFinite(n) || n === 0) return '0';
  if (n < 0.000001) return '<0.000001';
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function createOnChainStrategy(options: {
  account: CasHexAddress;
  contracts: StrategyContracts;
  draft: StrategyDraft;
  tokenInInfo?: TokenWithBalance;
  existingCommittedWei: bigint;
  publicClient: WagmiPublicClient;
  writeContractAsync: WriteContractFn;
  onStep: (
    id: StrategyStep['id'],
    status: StrategyStepStatus,
    detail: string,
    txHash?: `0x${string}`,
  ) => void;
}): Promise<{ request: CasCreateJobRequest; onChainJobId?: `0x${string}` }> {
  const {
    account,
    contracts,
    draft,
    existingCommittedWei,
    publicClient,
    writeContractAsync,
    onStep,
  } = options;

  if (contracts.automationManagerAddress === ZERO_ADDRESS)
    throw new Error('Automation manager address is not configured.');

  const tokenInDecimals = tokenDecimals(options.tokenInInfo);
  const resolvedTokenIn = resolveTokenInAddress(draft.tokenIn, contracts.wcfxAddress);
  const resolvedTokenOut = resolveTokenInAddress(draft.tokenOut, contracts.wcfxAddress);
  const amountInWei = parseUnits(draft.amountIn.trim() || '0', tokenInDecimals);
  const amountPerSwapWei = parseUnits(draft.amountPerSwap.trim() || '0', tokenInDecimals);
  const requiredAllowance =
    draft.kind === 'limit_order' ? amountInWei : amountPerSwapWei * BigInt(draft.totalSwaps);
  const tokenInIsNative = draft.tokenIn.toLowerCase() === ZERO_ADDRESS.toLowerCase();

  // ── Step 1: Wrap CFX → WCFX if needed ────────────────────────────────────

  if (tokenInIsNative) {
    if (contracts.wcfxAddress === ZERO_ADDRESS) throw new Error('WCFX address is not configured.');

    onStep('wrap', 'active', 'Checking WCFX balance');

    const wcfxBalance = (await publicClient.readContract({
      address: contracts.wcfxAddress,
      abi: WCFX_ABI,
      functionName: 'balanceOf',
      args: [account],
    })) as bigint;

    const shortfall = existingCommittedWei + requiredAllowance - wcfxBalance;
    if (shortfall > 0n) {
      const hash = await writeContractAsync({
        address: contracts.wcfxAddress,
        abi: WCFX_ABI,
        functionName: 'deposit',
        value: shortfall,
      });
      onStep('wrap', 'waiting', 'Waiting for wrap confirmation', hash);
      await publicClient.waitForTransactionReceipt({
        hash,
        pollingInterval: 2_000,
        timeout: 120_000,
      });
      onStep('wrap', 'done', `Wrapped ${formatTokenAmount(shortfall)} CFX`, hash);
    } else {
      onStep('wrap', 'skipped', 'WCFX balance already covers this strategy');
    }
  }

  // ── Step 2: Approve token spending ───────────────────────────────────────

  onStep('approve', 'active', 'Checking allowance');

  const currentAllowance = (await publicClient.readContract({
    address: resolvedTokenIn,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [account, contracts.automationManagerAddress],
  })) as bigint;

  const totalRequired = existingCommittedWei + requiredAllowance;
  if (currentAllowance < totalRequired) {
    const approvalAmount = draft.unlimitedApproval ? MAX_UINT256 : totalRequired;
    const approveHash = await writeContractAsync({
      address: resolvedTokenIn,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [contracts.automationManagerAddress, approvalAmount],
    });
    onStep('approve', 'waiting', 'Waiting for approval confirmation', approveHash);
    await publicClient.waitForTransactionReceipt({
      hash: approveHash,
      pollingInterval: 2_000,
      timeout: 120_000,
    });
    onStep(
      'approve',
      'done',
      draft.unlimitedApproval ? 'Unlimited approval confirmed' : 'Allowance approved',
      approveHash,
    );
  } else {
    onStep('approve', 'skipped', 'Allowance already sufficient');
  }

  // ── Step 3: Register strategy on-chain ───────────────────────────────────

  onStep('onchain', 'active', 'Waiting for wallet confirmation');

  const expiresAt =
    draft.expiryDays > 0 ? BigInt(Math.floor(Date.now() / 1000) + draft.expiryDays * 86_400) : 0n;

  let strategyHash: `0x${string}`;
  let request: CasCreateJobRequest;

  if (draft.kind === 'limit_order') {
    const targetPriceWei = parseUnits(draft.targetPrice.trim() || '0', 18);
    const expectedOut = targetPriceWei > 0n ? (amountInWei * targetPriceWei) / 10n ** 18n : 0n;
    const minAmountOut = (expectedOut * BigInt(10_000 - draft.slippageBps)) / 10_000n;

    strategyHash = await writeContractAsync({
      address: contracts.automationManagerAddress,
      abi: AUTOMATION_MANAGER_ABI,
      functionName: 'createLimitOrder',
      args: [
        {
          tokenIn: resolvedTokenIn,
          tokenOut: resolvedTokenOut,
          amountIn: amountInWei,
          minAmountOut,
          targetPrice: targetPriceWei,
          triggerAbove: draft.direction === 'gte',
        },
        draft.slippageBps,
        expiresAt,
      ],
    });

    request = {
      type: 'limit_order',
      tokenIn: resolvedTokenIn,
      tokenOut: resolvedTokenOut,
      amountIn: amountInWei.toString(),
      minAmountOut: minAmountOut.toString(),
      targetPrice: targetPriceWei.toString(),
      direction: draft.direction,
      slippageBps: draft.slippageBps,
      ...(draft.expiryDays > 0 ? { expiresAt: Date.now() + draft.expiryDays * 86_400_000 } : {}),
    };
  } else {
    strategyHash = await writeContractAsync({
      address: contracts.automationManagerAddress,
      abi: AUTOMATION_MANAGER_ABI,
      functionName: 'createDCAJob',
      args: [
        {
          tokenIn: resolvedTokenIn,
          tokenOut: resolvedTokenOut,
          amountPerSwap: amountPerSwapWei,
          intervalSeconds: BigInt(draft.intervalSeconds),
          totalSwaps: draft.totalSwaps,
          swapsCompleted: 0,
          nextExecution: 0n,
        },
        draft.slippageBps,
        expiresAt,
      ],
    });

    request = {
      type: 'dca',
      tokenIn: resolvedTokenIn,
      tokenOut: resolvedTokenOut,
      amountPerSwap: amountPerSwapWei.toString(),
      intervalSeconds: draft.intervalSeconds,
      totalSwaps: draft.totalSwaps,
      nextExecution: 0,
      slippageBps: draft.slippageBps,
      ...(draft.expiryDays > 0 ? { expiresAt: Date.now() + draft.expiryDays * 86_400_000 } : {}),
    };
  }

  onStep('onchain', 'waiting', 'Waiting for on-chain registration', strategyHash);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: strategyHash,
    pollingInterval: 2_000,
    timeout: 120_000,
  });

  let onChainJobId: `0x${string}` | undefined;
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: AUTOMATION_MANAGER_ABI,
        eventName: 'JobCreated',
        topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
        data: log.data,
      });
      const jobId = decoded.args.jobId;
      if (typeof jobId === 'string' && jobId.startsWith('0x'))
        onChainJobId = jobId as `0x${string}`;
    } catch {
      // skip non-matching logs
    }
  }

  onStep(
    'onchain',
    'done',
    onChainJobId ? `Registered ${onChainJobId.slice(0, 10)}…` : 'Registered on-chain',
    strategyHash,
  );

  const requestWithJobId = {
    ...request,
    ...(onChainJobId ? { onChainJobId } : {}),
  };
  return { request: requestWithJobId, ...(onChainJobId ? { onChainJobId } : {}) };
}
