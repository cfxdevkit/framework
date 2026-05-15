import type {
  CasAdminStatusResponse,
  CasApiClient,
  CasSafetyConfigPatchRequest,
  CasSafetyConfigResponse,
  CasSystemStatusResponse,
} from '@cfxdevkit/cas-shared';
import { Field, IconButton, Metric, Notice, Panel, PanelBody, StatusGrid } from '@cfxdevkit/ui';
import { Pause, Play, RefreshCw, ServerCog } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export interface SystemAdminPanelProps {
  client: CasApiClient;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function SystemAdminPanel({ client, isAuthenticated, isAdmin }: SystemAdminPanelProps) {
  const [status, setStatus] = useState<CasSystemStatusResponse | null>(null);
  const [admin, setAdmin] = useState<CasAdminStatusResponse | null>(null);
  const [safety, setSafety] = useState<CasSafetyConfigResponse | null>(null);
  const [message, setMessage] = useState('System status not loaded.');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setStatus(await client.systemStatus());
      if (isAuthenticated) setAdmin(await client.adminStatus());
      if (isAdmin) setSafety(await client.adminSafetyConfig());
      setMessage('System status refreshed.');
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }, [client, isAdmin, isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setPaused = async (paused: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const next = paused ? await client.adminPause() : await client.adminResume();
      setAdmin(next);
      setSafety((current) => (current ? { ...current, globalPause: next.paused } : current));
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
        {isAdmin ? (
          <SafetyConfigForm
            config={safety}
            busy={busy}
            onSave={async (patch) => {
              setBusy(true);
              setError(null);
              try {
                setSafety(await client.adminPatchSafetyConfig(patch));
                setMessage('Safety config updated.');
              } catch (error) {
                setError(error instanceof Error ? error.message : String(error));
              } finally {
                setBusy(false);
              }
            }}
          />
        ) : null}
      </PanelBody>
    </Panel>
  );
}

function SafetyConfigForm({ config, busy, onSave }: SafetyConfigFormProps) {
  const [maxSwapUsd, setMaxSwapUsd] = useState('');
  const [slippageBps, setSlippageBps] = useState('');
  const [maxRetries, setMaxRetries] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    setMaxSwapUsd(config.maxSwapUsd === null ? '' : String(config.maxSwapUsd));
    setSlippageBps(String(config.slippageBps));
    setMaxRetries(String(config.maxRetries));
  }, [config]);

  const save = async () => {
    const nextSlippage = Number(slippageBps);
    if (!Number.isInteger(nextSlippage) || nextSlippage < 0 || nextSlippage > 10_000) {
      setError('slippageBps must be between 0 and 10000');
      return;
    }
    const nextRetries = Number(maxRetries);
    if (!Number.isInteger(nextRetries) || nextRetries < 0) {
      setError('maxRetries must be a non-negative integer');
      return;
    }
    const nextMaxSwapUsd = maxSwapUsd.trim() === '' ? null : Number(maxSwapUsd);
    if (nextMaxSwapUsd !== null && (!Number.isFinite(nextMaxSwapUsd) || nextMaxSwapUsd < 0)) {
      setError('maxSwapUsd must be a non-negative number or empty');
      return;
    }
    setError(null);
    await onSave({
      maxSwapUsd: nextMaxSwapUsd,
      slippageBps: nextSlippage,
      maxRetries: nextRetries,
    });
  };

  return (
    <div className="safety-form">
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="field-grid three">
        <Field className="field" label="Max swap USD">
          <input
            className="input"
            type="number"
            min="0"
            placeholder="No cap"
            value={maxSwapUsd}
            onChange={(event) => setMaxSwapUsd(event.target.value)}
          />
        </Field>
        <Field className="field" label="Slippage bps">
          <input
            className="input"
            type="number"
            min="0"
            max="10000"
            value={slippageBps}
            onChange={(event) => setSlippageBps(event.target.value)}
          />
        </Field>
        <Field className="field" label="Max retries">
          <input
            className="input"
            type="number"
            min="0"
            value={maxRetries}
            onChange={(event) => setMaxRetries(event.target.value)}
          />
        </Field>
      </div>
      <button
        className="button"
        type="button"
        disabled={busy || !config}
        onClick={() => void save()}
      >
        Save safety config
      </button>
    </div>
  );
}

interface SafetyConfigFormProps {
  config: CasSafetyConfigResponse | null;
  busy: boolean;
  onSave: (patch: CasSafetyConfigPatchRequest) => Promise<void>;
}
