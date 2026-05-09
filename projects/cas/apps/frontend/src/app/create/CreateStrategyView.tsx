'use client';

import type { CasJobDto } from '@cfxdevkit/cas-shared';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppShell, IconButton, Notice, Topbar } from '../../components/ui';
import { useAuthContext } from '../auth-context';

const StrategyBuilder = dynamic(
  () => import('../../components/StrategyBuilder').then((module) => module.StrategyBuilder),
  { ssr: false },
);

export function CreateStrategyView() {
  const router = useRouter();
  const { client, token } = useAuthContext();
  const [jobs, setJobs] = useState<CasJobDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshJobs = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      setJobs((await client.jobs()).jobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [client, token]);

  useEffect(() => {
    void refreshJobs();
  }, [refreshJobs]);

  return (
    <AppShell>
      <Topbar
        brand={
          <>
            <h1>Create Strategy</h1>
            <span>Register a limit order or DCA job with CAS keeper automation</span>
          </>
        }
        actions={
          <>
            <Link className="button" href="/dashboard">
              <ArrowLeft size={17} />
              Dashboard
            </Link>
            <IconButton title="Refresh jobs" onClick={refreshJobs} disabled={busy || !token}>
              <RefreshCw size={17} />
            </IconButton>
          </>
        }
      />
      <section className="create-layout">
        {!token ? (
          <Notice tone="error">Connect and sign in before creating a strategy.</Notice>
        ) : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        <StrategyBuilder jobs={jobs} onJobCreated={() => router.push('/dashboard')} />
      </section>
    </AppShell>
  );
}
