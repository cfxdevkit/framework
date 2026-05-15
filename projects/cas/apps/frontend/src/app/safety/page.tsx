'use client';

import type { CasAdminStatusResponse, CasSystemStatusResponse } from '@cfxdevkit/cas-shared';
import {
  AppShell,
  IconButton,
  Metric,
  Notice,
  Panel,
  PanelBody,
  StatusGrid,
  Topbar,
} from '@cfxdevkit/ui';
import {
  Activity,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuthContext } from '../auth-context';

function timeAgo(ts: number | null): string {
  if (ts === null) return 'never';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export
export default function SafetyPage() {
  const { client, token, isAdmin } = useAuthContext();
  const [system, setSystem] = useState<CasSystemStatusResponse | null>(null);
  const [adminStatus, setAdminStatus] = useState<CasAdminStatusResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const isAuthenticated = token.length > 0;

  const loadStatus = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const [sysRes, adminRes] = await Promise.all([
        client.systemStatus(),
        isAdmin ? client.adminStatus() : Promise.resolve(null),
      ]);
      setSystem(sysRes);
      if (adminRes) setAdminStatus(adminRes);
      setMessage('Status refreshed');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [client, isAdmin]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handlePause = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await client.adminPause();
      setAdminStatus(result);
      setMessage('System paused');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResume = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await client.adminResume();
      setAdminStatus(result);
      setMessage('System resumed');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const paused = adminStatus?.paused ?? system?.paused ?? false;

  return (
    <AppShell>
      <Topbar
        brand={
          <>
            <h1>Safety Controls</h1>
            <span>System status, pause/resume and contract health</span>
          </>
        }
        actions={
          <IconButton title="Refresh status" onClick={loadStatus} disabled={busy}>
            <RefreshCw size={17} />
          </IconButton>
        }
      />

      <div style={{ padding: '16px', display: 'grid', gap: '12px', maxWidth: '820px' }}>
        {error && <Notice tone="error">{error}</Notice>}
        {!error && message && <Notice tone="ok">{message}</Notice>}

        {!isAuthenticated && <Notice>Sign in on the dashboard to see admin controls.</Notice>}

        {/* Pause / Resume */}
        {isAdmin && (
          <Panel
            title="Global pause"
            icon={paused ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
          >
            <StatusGrid>
              <Metric label="Status" value={paused ? 'PAUSED' : 'Running'} />
              <Metric label="Worker" value={system?.worker.status ?? 'unknown'} />
              <Metric
                label="Last execution"
                value={timeAgo(system?.worker.lastExecutionAt ?? null)}
              />
            </StatusGrid>
            <PanelBody>
              <div className="inline-actions">
                <button
                  className="button danger"
                  type="button"
                  onClick={handlePause}
                  disabled={busy || paused}
                >
                  <PauseCircle size={17} />
                  Pause system
                </button>
                <button
                  className="button primary"
                  type="button"
                  onClick={handleResume}
                  disabled={busy || !paused}
                >
                  <PlayCircle size={17} />
                  Resume system
                </button>
              </div>
            </PanelBody>
          </Panel>
        )}

        {/* System status */}
        {system && (
          <>
            <Panel title="Backend" icon={<Activity size={16} />}>
              <StatusGrid>
                <Metric label="Status" value={system.backend.ok ? 'Online' : 'Error'} />
                <Metric label="Uptime" value={system.backend.uptimeHuman} />
                <Metric label="Network" value={system.network} />
              </StatusGrid>
            </Panel>

            <Panel title="Database">
              <StatusGrid>
                <Metric label="Jobs" value={String(system.database.jobCount)} />
                <Metric label="Pending" value={String(system.database.pending)} />
                <Metric label="Active" value={String(system.database.active)} />
              </StatusGrid>
              <StatusGrid>
                <Metric label="Failed" value={String(system.database.failed)} />
                <Metric label="Last execution" value={timeAgo(system.database.lastExecutionAt)} />
                <Metric label="Executions" value={String(system.database.executionCount)} />
              </StatusGrid>
            </Panel>

            <Panel title="RPC">
              <StatusGrid>
                <Metric label="Status" value={system.rpc.ok ? 'Online' : 'Error'} />
                <Metric label="Block" value={system.rpc.blockNumber ?? 'unknown'} />
                <Metric
                  label="Latency"
                  value={system.rpc.latencyMs != null ? `${system.rpc.latencyMs}ms` : 'unknown'}
                />
              </StatusGrid>
              <PanelBody>
                <Notice>{system.rpc.url}</Notice>
                {system.rpc.error && <Notice tone="error">{system.rpc.error}</Notice>}
              </PanelBody>
            </Panel>

            <Panel title="Contracts">
              <StatusGrid>
                <Metric
                  label="AutomationManager"
                  value={system.contracts.automationManager.ok ? 'OK' : 'Error'}
                />
                <Metric
                  label="PriceAdapter"
                  value={system.contracts.priceAdapter.ok ? 'OK' : 'Error'}
                />
                <Metric
                  label="PermitHandler"
                  value={system.contracts.permitHandler.ok ? 'OK' : 'Error'}
                />
              </StatusGrid>
              <PanelBody>
                {[
                  system.contracts.automationManager,
                  system.contracts.priceAdapter,
                  system.contracts.permitHandler,
                ].map((c) =>
                  c.error ? (
                    <Notice key={c.address} tone="error">
                      {c.error}
                    </Notice>
                  ) : null,
                )}
                <Notice>AutomationManager: {system.contracts.automationManager.address}</Notice>
              </PanelBody>
            </Panel>
          </>
        )}
      </div>
    </AppShell>
  );
}
