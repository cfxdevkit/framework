'use client';

import type { CasHexAddress, CasJobDto } from '@cfxdevkit/cas-shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseUnits } from 'viem';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { useAuthContext } from '../app/auth-context';
import { usePoolsContext } from '../app/pools-context';
import {
  buildStrategySteps,
  CFX_NATIVE_ADDRESS,
  createInitialStrategyDraft,
  pairedTokens,
  readContracts,
  readExistingCommitted,
  resolveTokenInAddress,
  type StrategyContracts,
  type StrategyDraft,
  type StrategyStep,
  type StrategyStepStatus,
  tokenDecimals,
} from '../lib/strategy';
import type { WriteContractFn } from '../lib/strategy/chain';
import { createOnChainStrategy } from '../lib/strategy/chain';
import { parseStrategyError, wrapOrUnwrapCfx } from '../lib/strategy/wrap';

// ── Hook return type ──────────────────────────────────────────────────────────

export interface UseStrategyBuilderResult {
  // State
  draft: StrategyDraft;
  steps: StrategyStep[] | null;
  message: string;
  error: string | null;
  busy: boolean;
  wrapMode: 'wrap' | 'unwrap';
  wrapAmount: string;

  // Derived
  tokens: ReturnType<typeof usePoolsContext>['tokens'];
  pairs: ReturnType<typeof usePoolsContext>['pairs'];
  tokenOutOptions: ReturnType<typeof usePoolsContext>['tokens'];
  tokenIn: ReturnType<typeof usePoolsContext>['tokens'][number] | undefined;
  tokenInIsCfx: boolean;
  autoWrapShortfall: bigint;
  poolsError: string | null;
  poolsLoading: boolean;
  balancesLoading: boolean;
  contracts: StrategyContracts;
  account: CasHexAddress | undefined;
  token: string;

  // Actions
  patch: (value: Partial<StrategyDraft>) => void;
  setWrapMode: (mode: 'wrap' | 'unwrap') => void;
  setWrapAmount: (amount: string) => void;
  refresh: () => void;
  createStrategy: () => Promise<void>;
  convertWcfx: () => Promise<void>;
}

export function useStrategyBuilder(
  jobs: CasJobDto[],
  onJobCreated: (job: CasJobDto) => void,
): UseStrategyBuilderResult {
  const { address: account } = useAccount();
  const { client, token } = useAuthContext();
  const {
    tokens,
    pairs,
    loading: poolsLoading,
    balancesLoading,
    error: poolsError,
    refresh,
  } = usePoolsContext();
  const publicClient = usePublicClient();
  const { writeContractAsync: _writeContractAsync } = useWriteContract();
  const writeContractAsync = _writeContractAsync as WriteContractFn;

  const contracts = useMemo(readContracts, []);

  const [draft, setDraft] = useState<StrategyDraft>(() => createInitialStrategyDraft());
  const [steps, setSteps] = useState<StrategyStep[] | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wrapMode, setWrapMode] = useState<'wrap' | 'unwrap'>('wrap');
  const [wrapAmount, setWrapAmount] = useState('');
  // Auto-select a valid tokenOut when tokenIn changes
  useEffect(() => {
    if (pairs.length === 0 || tokens.length === 0) return;
    const options = pairedTokens(
      { tokens, pairs } as Parameters<typeof pairedTokens>[0],
      tokens,
      draft.tokenIn,
      contracts.wcfxAddress,
    );
    const nextTokenOut = options[0];
    if (nextTokenOut && nextTokenOut.address !== draft.tokenOut) {
      setDraft((d) => ({ ...d, tokenOut: nextTokenOut.address }));
    }
  }, [draft.tokenIn, draft.tokenOut, contracts.wcfxAddress, pairs, tokens]);

  const tokenIn = tokens.find((t) => t.address === draft.tokenIn);

  const tokenOutOptions = useMemo(
    () =>
      pairs.length > 0
        ? pairedTokens(
            { tokens, pairs } as Parameters<typeof pairedTokens>[0],
            tokens,
            draft.tokenIn,
            contracts.wcfxAddress,
          )
        : tokens,
    [draft.tokenIn, pairs, tokens, contracts.wcfxAddress],
  );

  const tokenInIsCfx = draft.tokenIn.toLowerCase() === CFX_NATIVE_ADDRESS.toLowerCase();

  const amountRequiredWei = useMemo(() => {
    try {
      const dec = tokenDecimals(tokenIn);
      if (draft.kind === 'limit_order') return parseUnits(draft.amountIn || '0', dec);
      return parseUnits(draft.amountPerSwap || '0', dec) * BigInt(draft.totalSwaps || 1);
    } catch {
      return 0n;
    }
  }, [draft.amountIn, draft.amountPerSwap, draft.kind, draft.totalSwaps, tokenIn]);

  const existingCommittedWei = useMemo(
    () => readExistingCommitted(jobs, resolveTokenInAddress(draft.tokenIn, contracts.wcfxAddress)),
    [contracts.wcfxAddress, draft.tokenIn, jobs],
  );

  const wcfxBalanceWei = BigInt(
    tokens.find((t) => t.address.toLowerCase() === contracts.wcfxAddress.toLowerCase())
      ?.balanceWei ?? '0',
  );

  const autoWrapShortfall =
    tokenInIsCfx && amountRequiredWei + existingCommittedWei > wcfxBalanceWei
      ? amountRequiredWei + existingCommittedWei - wcfxBalanceWei
      : 0n;

  const patch = (value: Partial<StrategyDraft>) => setDraft((d) => ({ ...d, ...value }));

  const setStep = useCallback(
    (
      id: StrategyStep['id'],
      status: StrategyStepStatus,
      detail: string,
      txHash?: `0x${string}`,
    ) => {
      setSteps(
        (prev) =>
          prev?.map((s) =>
            s.id === id ? { ...s, status, detail, ...(txHash ? { txHash } : {}) } : s,
          ) ?? prev,
      );
    },
    [],
  );

  const createStrategy = async () => {
    setError(null);
    if (!account) {
      setError('Connect your wallet first.');
      return;
    }
    if (!token) {
      setError('Sign in before saving a strategy.');
      return;
    }
    if (!draft.tokenIn || !draft.tokenOut || draft.tokenIn === draft.tokenOut) {
      setError('Choose two different tokens.');
      return;
    }
    if (draft.kind === 'limit_order' && (!draft.amountIn || !draft.targetPrice)) {
      setError('Enter sell amount and target price.');
      return;
    }
    if (
      draft.kind === 'dca' &&
      (!draft.amountPerSwap || draft.totalSwaps <= 0 || draft.intervalSeconds <= 0)
    ) {
      setError('Enter DCA amount, interval, and total swaps.');
      return;
    }
    if (!publicClient) {
      setError('RPC client not available.');
      return;
    }

    setBusy(true);
    setSteps(
      buildStrategySteps(
        autoWrapShortfall > 0n,
        draft.kind,
        tokenInIsCfx ? 'WCFX' : (tokenIn?.symbol ?? 'token'),
      ),
    );

    try {
      const { request } = await createOnChainStrategy({
        account,
        contracts,
        draft,
        existingCommittedWei,
        publicClient,
        writeContractAsync,
        onStep: setStep,
        ...(tokenIn ? { tokenInInfo: tokenIn } : {}),
      });
      setStep('save', 'active', 'Saving strategy to CAS');
      const response = await client.createJob(request);
      setStep('save', 'done', 'Strategy saved');
      onJobCreated(response.job);
      setMessage('Strategy created and saved.');
      setDraft((d) => ({
        ...createInitialStrategyDraft(),
        tokenIn: d.tokenIn,
        tokenOut: d.tokenOut,
      }));
      refresh();
    } catch (err) {
      const msg = parseStrategyError(err);
      setError(msg);
      setSteps(
        (prev) =>
          prev?.map((s) =>
            s.status === 'active' || s.status === 'waiting'
              ? { ...s, status: 'error', detail: msg }
              : s,
          ) ?? prev,
      );
    } finally {
      setBusy(false);
    }
  };

  const convertWcfx = async () => {
    setError(null);
    if (!account) {
      setError('Connect your wallet first.');
      return;
    }
    if (!publicClient) {
      setError('RPC client not available.');
      return;
    }
    setBusy(true);
    try {
      const amount = parseUnits(wrapAmount || '0', 18);
      await wrapOrUnwrapCfx({
        account,
        wcfxAddress: contracts.wcfxAddress,
        amount,
        mode: wrapMode,
        publicClient,
        writeContractAsync,
      });
      setMessage(wrapMode === 'wrap' ? 'CFX wrapped to WCFX.' : 'WCFX unwrapped to CFX.');
      setWrapAmount('');
      refresh();
    } catch (err) {
      setError(parseStrategyError(err));
    } finally {
      setBusy(false);
    }
  };

  return {
    draft,
    steps,
    message,
    error,
    busy,
    wrapMode,
    wrapAmount,
    tokens,
    pairs,
    tokenOutOptions,
    tokenIn,
    tokenInIsCfx,
    autoWrapShortfall,
    poolsError,
    poolsLoading,
    balancesLoading,
    contracts,
    account: account as CasHexAddress | undefined,
    token,
    patch,
    setWrapMode,
    setWrapAmount,
    refresh,
    createStrategy,
    convertWcfx,
  };
}
