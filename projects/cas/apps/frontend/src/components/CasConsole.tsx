'use client';

import type { CasExecutionDto, CasHealthResponse, CasJobDto } from '@cfxdevkit/cas-shared';
import { WalletPickerModal } from '@cfxdevkit/wallet-connect/ui';
import { Activity, RefreshCw, Save } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { useAuthContext } from '../app/auth-context';
import { ESPACE_CHAINS } from '../lib/ethereum';
import { JobsTable } from './JobsTable';
import { StrategyBuilder } from './StrategyBuilder';
import { SystemAdminPanel } from './SystemAdminPanel';
import {
  AppShell,
  IconButton,
  MainGrid,
  Metric,
  Notice,
  Panel,
  PanelBody,
  StatusGrid,
  Topbar,
} from './ui';
import { WalletPanel } from './WalletPanel';

const DEFAULT_NETWORK = process.env.NEXT_PUBLIC_CAS_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
const TARGET_CHAIN = ESPACE_CHAINS[DEFAULT_NETWORK];

export function CasConsole() {
  const {
    address: account,
    apiBase,
    client,
    isAdmin,
    login,
    logout,
    setApiBase,
    token,
  } = useAuthContext();
  const chainId = useChainId();
  const { switchChain: switchWagmiChain } = useSwitchChain();
  const [health, setHealth] = useState<CasHealthResponse | null>(null);
  const [jobs, setJobs] = useState<CasJobDto[]>([]);
  const [executions, setExecutions] = useState<Record<string, CasExecutionDto[]>>({});
  const [message, setMessage] = useState('Ready');
  const [error, setError] = useState<string | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const isAuthenticated = token.length > 0;

  const run = useCallback(async (task: () => Promise<void>, success: string) => {
    setBusy(true);
    setError(null);
    try {
      await task();
      setMessage(success);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, []);

  const refreshHealth = useCallback(async () => {
    await run(async () => setHealth(await client.health()), 'Backend health refreshed');
  }, [client, run]);

  const refreshJobs = useCallback(async () => {
    if (!isAuthenticated) return;
    await run(async () => setJobs((await client.jobs()).jobs), 'Jobs refreshed');
  }, [client, isAuthenticated, run]);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    if (isAuthenticated) void refreshJobs();
  }, [isAuthenticated, refreshJobs]);

  useEffect(() => {
    if (!token) return;
    const source = new EventSource(client.sseUrl());
    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as
        | { type: 'snapshot'; jobs: CasJobDto[] }
        | { type: 'job_update'; job: CasJobDto };
      if (payload.type === 'snapshot') setJobs(payload.jobs);
      if (payload.type === 'job_update') {
        setJobs((current) => [payload.job, ...current.filter((job) => job.id !== payload.job.id)]);
      }
    };
    source.onerror = () => source.close();
    return () => source.close();
  }, [client, token]);

  const saveConnection = () => {
    window.localStorage.setItem('cas.apiBase', apiBase);
    setApiBase(apiBase);
    setMessage('API base URL saved');
  };

  const connectWallet = async () => {
    setWalletModalOpen(true);
  };

  const switchWalletChain = async () => {
    await run(async () => {
      switchWagmiChain({ chainId: TARGET_CHAIN.chainId });
    }, `Switched to ${TARGET_CHAIN.name}`);
  };

  const signIn = async () => {
    await run(async () => {
      await login();
    }, 'Signed in and loaded jobs');
  };

  const signOut = () => {
    setJobs([]);
    logout();
    setMessage('Signed out');
  };

  const cancelJob = async (id: string) => {
    await run(async () => {
      const response = await client.cancelJob(id);
      setJobs((current) => current.map((job) => (job.id === id ? response.job : job)));
    }, 'Job cancelled');
  };

  const loadExecutions = async (id: string) => {
    await run(async () => {
      const response = await client.executions(id);
      setExecutions((current) => ({ ...current, [id]: response.executions }));
    }, 'Executions loaded');
  };

  return (
    <>
      <AppShell>
        <Topbar
          brand={
            <>
              <h1>CAS Strategy Console</h1>
              <span>Wallet, pools, on-chain registration, and keeper job tracking</span>
            </>
          }
          actions={
            <>
              <input
                className="input api-base-input"
                aria-label="CAS API base URL"
                value={apiBase}
                onChange={(event) => setApiBase(event.target.value)}
              />
              <IconButton title="Save settings" onClick={saveConnection}>
                <Save size={17} />
              </IconButton>
              <IconButton title="Refresh health" onClick={refreshHealth} disabled={busy}>
                <RefreshCw size={17} />
              </IconButton>
            </>
          }
        />

        <MainGrid
          sidebar={
            <>
              <Panel title="Runtime" icon={<Activity size={16} />}>
                <StatusGrid>
                  <Metric label="API" value={health?.ok ? 'online' : 'unknown'} />
                  <Metric label="Storage" value={health?.storage.kind ?? 'unread'} />
                  <Metric label="Session" value={isAuthenticated ? 'signed in' : 'not signed in'} />
                </StatusGrid>
                <PanelBody>
                  <Notice>{health?.storage.path ?? 'Backend health has not loaded yet.'}</Notice>
                  {error ? (
                    <Notice tone="error">{error}</Notice>
                  ) : (
                    <Notice tone="ok">{message}</Notice>
                  )}
                </PanelBody>
              </Panel>

              <WalletPanel
                account={account}
                chainId={chainId ?? null}
                targetChain={TARGET_CHAIN}
                token={token}
                busy={busy}
                onConnect={connectWallet}
                onSwitchChain={switchWalletChain}
                onSignIn={signIn}
                onSignOut={signOut}
              />

              <SystemAdminPanel
                client={client}
                isAuthenticated={isAuthenticated}
                isAdmin={isAdmin}
              />
            </>
          }
        >
          <div className="stack">
            <StrategyBuilder
              jobs={jobs}
              onJobCreated={(job) =>
                setJobs((current) => [job, ...current.filter((item) => item.id !== job.id)])
              }
            />

            <Panel
              title="Jobs"
              actions={
                <IconButton
                  title="Refresh jobs"
                  onClick={refreshJobs}
                  disabled={busy || !isAuthenticated}
                >
                  <RefreshCw size={17} />
                </IconButton>
              }
            >
              <div className="table-wrap">
                <JobsTable
                  jobs={jobs}
                  executions={executions}
                  busy={busy}
                  onCancel={cancelJob}
                  onExecutions={loadExecutions}
                />
              </div>
            </Panel>
          </div>
        </MainGrid>
      </AppShell>
      <WalletPickerModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </>
  );
}
