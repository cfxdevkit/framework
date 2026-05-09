import type {
  CasAdminStatusResponse,
  CasApiClient,
  CasSystemStatusResponse,
} from '@cfxdevkit/cas-shared';
import { Pause, Play, RefreshCw, ServerCog } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { IconButton, Metric, Notice, Panel, PanelBody, StatusGrid } from './ui';

export interface SystemAdminPanelProps {
  client: CasApiClient;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function SystemAdminPanel({ client, isAuthenticated, isAdmin }: SystemAdminPanelProps) {
  const [status, setStatus] = useState<CasSystemStatusResponse | null>(null);
  const [admin, setAdmin] = useState<CasAdminStatusResponse | null>(null);
  const [message, setMessage] = useState('System status not loaded.');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setStatus(await client.systemStatus());
      if (isAuthenticated) setAdmin(await client.adminStatus());
      setMessage('System status refreshed.');
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, [client, isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setPaused = async (paused: boolean) => {
    setBusy(true);
    setError(null);
    try {
      setAdmin(paused ? await client.adminPause() : await client.adminResume());
      setMessage(paused ? 'CAS paused.' : 'CAS resumed.');
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title="System"
      icon={<ServerCog size={16} />}
      actions={
        <IconButton title="Refresh system" onClick={refresh} disabled={busy}>
          <RefreshCw size={16} />
        </IconButton>
      }
    >
      <StatusGrid>
        <Metric
          label="RPC"
          value={status?.rpc.ok ? `ok ${status.rpc.blockNumber ?? ''}` : 'unknown'}
        />
        <Metric label="Worker" value={status?.worker.status ?? 'unknown'} />
        <Metric label="Paused" value={String(admin?.paused ?? status?.paused ?? false)} />
      </StatusGrid>
      <PanelBody>
        {error ? <Notice tone="error">{error}</Notice> : <Notice>{message}</Notice>}
        <div className="field-row">
          <Metric label="Jobs" value={status ? String(status.database.jobCount) : 'n/a'} />
          <Metric
            label="Executions"
            value={status ? String(status.database.executionCount) : 'n/a'}
          />
        </div>
        <div className="inline-actions">
          <button
            className="button"
            type="button"
            onClick={() => void setPaused(true)}
            disabled={busy || !isAdmin}
          >
            <Pause size={17} />
            Pause
          </button>
          <button
            className="button"
            type="button"
            onClick={() => void setPaused(false)}
            disabled={busy || !isAdmin}
          >
            <Play size={17} />
            Resume
          </button>
        </div>
      </PanelBody>
    </Panel>
  );
}
