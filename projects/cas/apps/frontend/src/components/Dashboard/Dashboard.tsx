'use client';

import type { CasExecutionDto, CasJobDto } from '@cfxdevkit/cas-shared';
import { ClipboardList, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuthContext } from '../../app/auth-context';
import { JobsTable } from '../JobsTable';

export interface DashboardProps {
  onCreateNew: () => void;
}

export function Dashboard({ onCreateNew }: DashboardProps) {
  const { client, token } = useAuthContext();
  const [jobs, setJobs] = useState<CasJobDto[]>([]);
  const [executions, setExecutions] = useState<Record<string, CasExecutionDto[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await client.jobs();
      setJobs(res.jobs);
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to load jobs');
    } finally {
      setBusy(false);
    }
  }, [client, token]);

  // Initial load when authenticated
  useEffect(() => {
    if (token) void loadJobs();
  }, [token, loadJobs]);

  // SSE real-time updates
  useEffect(() => {
    if (!token) return;
    const source = new EventSource(client.sseUrl());
    source.onmessage = (event) => {
      const payload = JSON.parse(event.data as string) as
        | { type: 'snapshot'; jobs: CasJobDto[] }
        | { type: 'job_update'; job: CasJobDto };
      if (payload.type === 'snapshot') setJobs(payload.jobs);
      if (payload.type === 'job_update') {
        setJobs((current) => [payload.job, ...current.filter((j) => j.id !== payload.job.id)]);
      }
    };
    source.onerror = () => source.close();
    return () => source.close();
  }, [client, token]);

  const cancelJob = useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        const res = await client.cancelJob(id);
        setJobs((current) => current.map((j) => (j.id === id ? res.job : j)));
      } catch (e: unknown) {
        setError((e as Error).message ?? 'Cancel failed');
      } finally {
        setBusy(false);
      }
    },
    [client],
  );

  const loadExecutions = useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        const res = await client.executions(id);
        setExecutions((current) => ({ ...current, [id]: res.executions }));
      } catch (e: unknown) {
        setError((e as Error).message ?? 'Failed to load executions');
      } finally {
        setBusy(false);
      }
    },
    [client],
  );

  if (!token) return null;

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 px-4 py-3 rounded-lg">
          {error}
        </p>
      )}

      {jobs.length === 0 && !busy ? (
        <div className="flex flex-col items-center justify-center py-20 gap-6 border border-dashed border-slate-800 rounded-2xl">
          <ClipboardList className="h-12 w-12 text-slate-700" />
          <div className="text-center space-y-2">
            <p className="text-slate-400 font-medium">No strategies yet</p>
            <p className="text-slate-600 text-sm">
              Create your first limit order or DCA strategy to get started.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateNew}
            className="flex items-center gap-2 bg-conflux-600 hover:bg-conflux-500 text-white font-semibold
                       py-2.5 px-6 rounded-xl transition-colors shadow-md shadow-conflux-900/40 text-sm"
          >
            <Plus className="h-4 w-4" />
            New Strategy
          </button>
        </div>
      ) : (
        <div className="relative">
          {busy && (
            <div className="absolute top-0 right-0 p-2">
              <RefreshCw className="h-4 w-4 text-slate-500 animate-spin" />
            </div>
          )}
          <JobsTable
            jobs={jobs}
            executions={executions}
            busy={busy}
            onCancel={cancelJob}
            onExecutions={loadExecutions}
          />
        </div>
      )}
    </div>
  );
}
