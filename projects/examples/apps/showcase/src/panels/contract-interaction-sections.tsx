import type { DeployLogEntry, DeployNetworkId } from '../contexts/CompilerSession.js';
import { NETWORK_LABEL, NETWORK_ORDER } from './contract-interaction-helpers.js';

export function ModeTabs({
  mode,
  setMode,
  historyLength,
}: {
  mode: 'session' | 'manual';
  setMode: (mode: 'session' | 'manual') => void;
  historyLength: number;
}) {
  return (
    <div className="row" style={{ gap: 6 }}>
      <button
        type="button"
        className={mode === 'session' ? 'primary' : 'secondary'}
        onClick={() => setMode('session')}
      >
        Saved deployments ({historyLength})
      </button>
      <button
        type="button"
        className={mode === 'manual' ? 'primary' : 'secondary'}
        onClick={() => setMode('manual')}
      >
        Manual address + ABI
      </button>
    </div>
  );
}

export function SessionDeployments({
  history,
  grouped,
  activeSession,
  selectedId,
  setSelectedId,
  removeDeploy,
}: {
  history: DeployLogEntry[];
  grouped: Map<DeployNetworkId, Map<'core' | 'espace', DeployLogEntry[]>>;
  activeSession: DeployLogEntry | null;
  selectedId: string;
  setSelectedId: (id: string) => void;
  removeDeploy: (id: string) => void;
}) {
  if (history.length === 0) {
    return (
      <p className="muted">
        No deploys recorded yet. Use the Compiler tab to compile + deploy a template, or switch to
        "Manual address + ABI".
      </p>
    );
  }
  return (
    <div className="card" style={{ padding: 8 }}>
      {NETWORK_ORDER.map((netId) => {
        const byFamily = grouped.get(netId);
        if (!byFamily) return null;
        return (
          <NetworkGroup
            key={netId}
            netId={netId}
            byFamily={byFamily}
            activeSession={activeSession}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            removeDeploy={removeDeploy}
          />
        );
      })}
    </div>
  );
}

function NetworkGroup({
  netId,
  byFamily,
  activeSession,
  selectedId,
  setSelectedId,
  removeDeploy,
}: {
  netId: DeployNetworkId;
  byFamily: Map<'core' | 'espace', DeployLogEntry[]>;
  activeSession: DeployLogEntry | null;
  selectedId: string;
  setSelectedId: (id: string) => void;
  removeDeploy: (id: string) => void;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        className="muted small"
        style={{ textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}
      >
        {NETWORK_LABEL[netId]}
      </div>
      {(['core', 'espace'] as const).map((family) => {
        const items = byFamily.get(family);
        if (!items || items.length === 0) return null;
        return (
          <FamilyGroup
            key={family}
            family={family}
            items={items}
            activeSession={activeSession}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            removeDeploy={removeDeploy}
          />
        );
      })}
    </div>
  );
}

function FamilyGroup({
  family,
  items,
  activeSession,
  selectedId,
  setSelectedId,
  removeDeploy,
}: {
  family: 'core' | 'espace';
  items: DeployLogEntry[];
  activeSession: DeployLogEntry | null;
  selectedId: string;
  setSelectedId: (id: string) => void;
  removeDeploy: (id: string) => void;
}) {
  return (
    <div style={{ marginLeft: 8, marginBottom: 4 }}>
      <div className="small" style={{ marginBottom: 2 }}>
        <span className={`space-badge space-${family}`}>
          {family === 'core' ? 'Core' : 'eSpace'}
        </span>{' '}
        <span className="muted">({items.length})</span>
      </div>
      {items.map((entry) => {
        const isSelected = (activeSession?.id ?? '') === entry.id;
        return (
          <div
            key={entry.id}
            className="row"
            style={{
              alignItems: 'center',
              gap: 6,
              padding: '2px 6px',
              background: isSelected ? 'var(--bg-soft, rgba(0,0,0,0.15))' : '',
              borderRadius: 4,
            }}
          >
            <button
              type="button"
              className={isSelected ? 'primary' : 'secondary'}
              onClick={() => setSelectedId(entry.id)}
              style={{ minWidth: 80 }}
            >
              {isSelected ? 'Selected' : 'Select'}
            </button>
            <code className="mono small" style={{ flex: '1 1 auto' }}>
              {entry.contractName} · {entry.address.slice(0, 18)}...
            </code>
            <span className="muted small">chainId {entry.chainId}</span>
            <button
              type="button"
              className="secondary small"
              title="Remove from history"
              onClick={() => {
                if (selectedId === entry.id) setSelectedId('');
                removeDeploy(entry.id);
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
