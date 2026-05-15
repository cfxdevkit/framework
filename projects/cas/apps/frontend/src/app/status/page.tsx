'use client';

import type { CasSystemStatusResponse } from '@cfxdevkit/cas-shared';
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
} from '@cfxdevkit/ui';
import { Activity, Database, RefreshCw, ServerCog, Wifi } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuthContext } from '../auth-context';

// biome-ignore lint/style/noDefaultExport: Next.js app router requires a default page export.
export default function StatusPage() {
  const { client } = useAuthContext();
  const [status, setStatus] = useState<CasSystemStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setStatus(await client.systemStatus());
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, [client]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AppShell>
      <Topbar
        brand={
          <>
            <h1>System Status</h1>
            <span>Backend, database, RPC, contracts, and worker health</span>
          </>
        }
        actions={
          <IconButton title="Refresh status" onClick={refresh} disabled={busy}>
            <RefreshCw size={17} />
          </IconButton>
        }
      />
      <MainGrid
        sidebar={
          <>
            <Panel title="Backend" icon={<ServerCog size={16} />}>
              <StatusGrid>
                <Metric label="Status" value={status?.backend.ok ? 'online' : 'unknown'} />
                <Metric label="Uptime" value={status?.backend.uptimeHuman ?? 'n/a'} />
                <Metric label="Network" value={status?.network ?? 'n/a'} />
              </StatusGrid>
            </Panel>
            <Panel title="Database" icon={<Database size={16} />}>
              <StatusGrid>
                <Metric label="Jobs" value={status ? String(status.database.jobCount) : 'n/a'} />
                <Metric
                  label="Executions"
                  value={status ? String(status.database.executionCount) : 'n/a'}
                />
                <Metric label="Failed" value={status ? String(status.database.failed) : 'n/a'} />
              </StatusGrid>
            </Panel>
          </>
        }
      >
        <div className="stack">
          <Panel title="RPC" icon={<Wifi size={16} />}>
            <StatusGrid>
              <Metric label="Status" value={status?.rpc.ok ? 'ok' : 'unknown'} />
              <Metric label="Block" value={status?.rpc.blockNumber ?? 'n/a'} />
              <Metric
                label="Latency"
                value={status?.rpc.latencyMs ? `${status.rpc.latencyMs}ms` : 'n/a'}
              />
            </StatusGrid>
            <PanelBody>
              <Notice>{status?.rpc.url ?? 'RPC has not been checked yet.'}</Notice>
            </PanelBody>
          </Panel>
          <Panel title="Worker" icon={<Activity size={16} />}>
            <StatusGrid>
              <Metric label="Status" value={status?.worker.status ?? 'unknown'} />
              <Metric label="Paused" value={String(status?.paused ?? false)} />
              <Metric label="Checked" value={status ? `${status.checkedInMs}ms` : 'n/a'} />
            </StatusGrid>
            <PanelBody>
              {error ? (
                <Notice tone="error">{error}</Notice>
              ) : (
                <Notice>Last checked {status?.ts ?? 'never'}</Notice>
              )}
            </PanelBody>
          </Panel>
        </div>
      </MainGrid>
    </AppShell>
  );
}
