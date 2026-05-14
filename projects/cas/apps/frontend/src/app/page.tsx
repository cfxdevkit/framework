'use client';

import { Plus, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { injected, useAccount, useConnect } from 'wagmi';
import type { CasJobDto } from '@cfxdevkit/cas-shared';
import { ApprovalsModal } from '../components/ApprovalsModal';
import { Dashboard } from '../components/Dashboard/Dashboard';
import { StrategyModal } from '../components/StrategyModal';
import { WcfxWrapModal } from '../components/StrategyBuilder/WcfxWrapModal';
import { EXPECTED_CHAIN_NAME, useNetworkSwitch } from '../hooks/useNetworkSwitch';
import { useAuthContext } from './auth-context';

// ── Page ─────────────────────────────────────────────────────────────────────

// biome-ignore lint/style/noDefaultExport: Next.js app router requires a default export.
export default function HomePage() {
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const { address, token, isLoading, error, login } = useAuthContext();
  const { isWrongNetwork, isSwitching, switchError, handleSwitchNetwork } = useNetworkSwitch();
  const [mounted, setMounted] = useState(false);
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [wrapOpen, setWrapOpen] = useState(false);
  const [approvalsOpen, setApprovalsOpen] = useState(false);
  const [jobs, setJobs] = useState<CasJobDto[]>([]);

  const openStrategy = useCallback(() => setStrategyOpen(true), []);
  const closeStrategy = useCallback(() => setStrategyOpen(false), []);
  const openWrap = useCallback(() => setWrapOpen(true), []);
  const closeWrap = useCallback(() => setWrapOpen(false), []);
  const openApprovals = useCallback(() => setApprovalsOpen(true), []);
  const closeApprovals = useCallback(() => setApprovalsOpen(false), []);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="min-h-screen" />;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] text-center gap-10">
        <div className="space-y-6 relative">
          <div className="absolute inset-0 bg-conflux-500/20 blur-[100px] -z-10 rounded-full" />
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tight leading-tight">
            Automate your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-conflux-400 to-blue-600">
              Conflux
            </span>{' '}
            DeFi
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
            Non-custodial limit orders and DCA strategies on Conflux eSpace. Your keys, your
            tokens — executed automatically by decentralized keepers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => connect({ connector: injected() })}
          className="group relative inline-flex items-center justify-center bg-conflux-600 hover:bg-conflux-500 text-white text-lg font-semibold py-4 px-10 rounded-2xl transition-all shadow-[0_0_40px_-10px_rgba(0,120,200,0.6)] hover:shadow-[0_0_60px_-15px_rgba(0,120,200,0.8)] overflow-hidden"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <span className="relative">Connect Wallet to Start</span>
        </button>
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] text-center gap-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-white tracking-tight">Conflux Automation</h1>
          <p className="text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
            Please switch your wallet to{' '}
            <span className="text-amber-400 font-semibold">{EXPECTED_CHAIN_NAME}</span> to continue.
          </p>
          <p className="text-xs text-slate-500 font-mono">
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSwitchNetwork()}
          disabled={isSwitching}
          className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-lg font-semibold py-4 px-12 rounded-xl transition-colors shadow-lg shadow-amber-900/40"
        >
          {isSwitching ? 'Switching…' : `Switch to ${EXPECTED_CHAIN_NAME}`}
        </button>
        {switchError && <p className="text-red-400 text-sm">{switchError}</p>}
      </div>
    );
  }

  if (!token && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] text-center gap-6">
        <div className="w-10 h-10 rounded-full border-2 border-conflux-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-lg">
          Check your wallet — sign the message to continue.
        </p>
        <p className="text-xs text-slate-500 font-mono">
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] text-center gap-10">
        <div className="space-y-4 relative">
          <div className="absolute inset-0 bg-conflux-500/10 blur-[80px] -z-10 rounded-full" />
          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">
            Verify Ownership
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
            Sign the message in your wallet to securely authenticate. This does not trigger any
            blockchain transaction or cost gas.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/60 border border-slate-700 rounded-full text-sm font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse" />
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => void login()}
            className="group relative inline-flex items-center justify-center bg-conflux-600 hover:bg-conflux-500 text-white text-lg font-semibold py-4 px-12 rounded-2xl transition-all shadow-[0_0_30px_-5px_rgba(0,120,200,0.5)] hover:shadow-[0_0_40px_-5px_rgba(0,120,200,0.7)] overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative text-white font-semibold">Sign In with Wallet</span>
          </button>
          {error && (
            <p className="text-red-400 bg-red-950/40 border border-red-900/50 px-4 py-2 rounded-lg text-sm max-w-sm mt-2">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
            My Strategies
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700">
              Active &amp; Historical
            </span>
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openWrap}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-semibold py-2 px-4 rounded-xl transition-all shadow-sm text-sm"
            >
              <RefreshCcw className="h-4 w-4 text-conflux-400" />
              Wrap wCFX
            </button>
            <button
              type="button"
              onClick={openApprovals}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-semibold py-2 px-4 rounded-xl transition-all shadow-sm text-sm"
            >
              <ShieldCheck className="h-4 w-4 text-conflux-400" />
              Approvals
            </button>
            <button
              type="button"
              onClick={openStrategy}
              className="inline-flex items-center gap-2 bg-conflux-600 hover:bg-conflux-500 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-md shadow-conflux-900/40 text-sm group"
            >
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
              New Strategy
            </button>
          </div>
        </div>
        <Dashboard onCreateNew={openStrategy} />
      </div>

      <StrategyModal
        open={strategyOpen}
        onClose={closeStrategy}
        onJobCreated={(job) => setJobs((prev) => [job, ...prev])}
      />
      <WcfxWrapModal open={wrapOpen} onClose={closeWrap} />
      <ApprovalsModal open={approvalsOpen} onClose={closeApprovals} jobs={jobs} />
    </>
  );
}
