'use client';

import { RefreshCcw, X } from 'lucide-react';
import { useState } from 'react';
import { parseUnits } from 'viem';
import { usePublicClient, useWriteContract } from 'wagmi';
import { WCFX_ABI } from '@cfxdevkit/cas-shared';
import { useAuthContext } from '../../app/auth-context';
import { usePoolsContext } from '../../app/pools-context';
import { readContracts } from '../../lib/strategy';
import { CFX_NATIVE_ADDRESS } from '../../app/pools-context';

function fmtBalance(val: string) {
  const n = parseFloat(val);
  if (Number.isNaN(n) || n === 0) return '0.00';
  if (n < 0.0001) return '<0.0001';
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function WcfxWrapModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { address } = useAuthContext();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { tokens, refresh } = usePoolsContext();

  const [tab, setTab] = useState<'wrap' | 'unwrap'>('wrap');
  const [wrapInput, setWrapInput] = useState('');
  const [unwrapInput, setUnwrapInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  const contracts = readContracts();
  const wcfxAddr = contracts.wcfxAddress as `0x${string}`;
  const wcfxInfo = tokens.find((t) => t.address.toLowerCase() === wcfxAddr.toLowerCase());
  const cfxInfo = tokens.find((t) => t.address.toLowerCase() === CFX_NATIVE_ADDRESS.toLowerCase());

  async function handleWrap() {
    setError(null);
    setSuccess(null);
    if (!address || !publicClient) return;
    setBusy(true);
    try {
      const amount = parseUnits(wrapInput.trim() || '0', 18);
      if (amount <= 0n) {
        setError('Enter an amount.');
        return;
      }
      const feeData = await publicClient.estimateFeesPerGas();
      const mfpg = (feeData.maxFeePerGas * 120n) / 100n;
      const mpfpg = (feeData.maxPriorityFeePerGas * 120n) / 100n;
      const gas = await publicClient.estimateContractGas({
        address: wcfxAddr,
        abi: WCFX_ABI,
        functionName: 'deposit',
        value: amount,
        account: address as `0x${string}`,
      });
      const hash = await writeContractAsync({
        address: wcfxAddr,
        abi: WCFX_ABI,
        functionName: 'deposit',
        value: amount,
        gas: (gas * 130n) / 100n,
        maxFeePerGas: mfpg,
        maxPriorityFeePerGas: mpfpg,
      });
      await publicClient.waitForTransactionReceipt({
        hash,
        pollingInterval: 2_000,
        timeout: 120_000,
      });
      setSuccess(`${wrapInput} CFX wrapped to wCFX.`);
      setWrapInput('');
      refresh();
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Wrap failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleUnwrap() {
    setError(null);
    setSuccess(null);
    if (!address || !publicClient) return;
    setBusy(true);
    try {
      const amount = parseUnits(unwrapInput.trim() || '0', 18);
      if (amount <= 0n) {
        setError('Enter an amount.');
        return;
      }
      const feeData = await publicClient.estimateFeesPerGas();
      const mfpg = (feeData.maxFeePerGas * 120n) / 100n;
      const mpfpg = (feeData.maxPriorityFeePerGas * 120n) / 100n;
      const gas = await publicClient.estimateContractGas({
        address: wcfxAddr,
        abi: WCFX_ABI,
        functionName: 'withdraw',
        args: [amount],
        account: address as `0x${string}`,
      });
      const hash = await writeContractAsync({
        address: wcfxAddr,
        abi: WCFX_ABI,
        functionName: 'withdraw',
        args: [amount],
        gas: (gas * 130n) / 100n,
        maxFeePerGas: mfpg,
        maxPriorityFeePerGas: mpfpg,
      });
      await publicClient.waitForTransactionReceipt({
        hash,
        pollingInterval: 2_000,
        timeout: 120_000,
      });
      setSuccess(`${unwrapInput} wCFX unwrapped to CFX.`);
      setUnwrapInput('');
      refresh();
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Unwrap failed.');
    } finally {
      setBusy(false);
    }
  }

  const cfxBal = cfxInfo?.balanceFormatted ?? '0';
  const wcfxBal = wcfxInfo?.balanceFormatted ?? '0';
  const currentBal = tab === 'wrap' ? cfxBal : wcfxBal;
  const currentInput = tab === 'wrap' ? wrapInput : unwrapInput;
  const setCurrentInput = tab === 'wrap' ? setWrapInput : setUnwrapInput;
  const handleSubmit = tab === 'wrap' ? handleWrap : handleUnwrap;
  const fromLabel = tab === 'wrap' ? 'CFX' : 'wCFX';
  const toLabel = tab === 'wrap' ? 'wCFX' : 'CFX';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label="Wrap CFX"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        className={`absolute inset-0 w-full h-full bg-black/70 backdrop-blur-sm border-0 ${busy ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={busy ? undefined : onClose}
        onKeyDown={
          busy
            ? undefined
            : (e) => {
                if (e.key === 'Enter' || e.key === ' ') onClose();
              }
        }
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden animate-[modal-in_0.2s_cubic-bezier(0.16,1,0.3,1)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-conflux-400" /> Convert CFX
          </h2>
          <button
            type="button"
            onClick={busy ? undefined : onClose}
            disabled={busy}
            className={`p-1 rounded-lg transition-colors ${busy ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Tab switcher */}
          <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            {(['wrap', 'unwrap'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === t
                    ? 'bg-conflux-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {t === 'wrap' ? 'Wrap (CFX → wCFX)' : 'Unwrap (wCFX → CFX)'}
              </button>
            ))}
          </div>

          {/* Amount input */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Amount</span>
              <button
                type="button"
                onClick={() => setCurrentInput(currentBal)}
                className="text-conflux-400 hover:text-conflux-300 font-medium transition-colors"
              >
                Max: {fmtBalance(currentBal)} {fromLabel}
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="0.0"
                min="0"
                step="any"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500
                           focus:outline-none focus:border-conflux-500 focus:ring-1 focus:ring-conflux-500/50 pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                {fromLabel}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <span>↓</span>
              <span>You receive {fromLabel === 'CFX' ? 'wCFX' : 'CFX'}</span>
              <span>(1:1)</span>
            </div>
          </div>

          {/* Status messages */}
          {error && (
            <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-400 text-sm bg-green-950/40 border border-green-900/50 px-3 py-2 rounded-lg">
              {success}
            </p>
          )}

          {/* Submit button */}
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={busy || !currentInput}
            className="w-full bg-conflux-600 hover:bg-conflux-500 disabled:opacity-40 disabled:cursor-not-allowed
                       text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {busy
              ? 'Processing…'
              : `${tab === 'wrap' ? 'Wrap' : 'Unwrap'} ${fromLabel} → ${toLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}
