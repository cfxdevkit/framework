import type { DeployLogEntry } from '../contexts/CompilerSession.js';
import type { CatalogEntry } from '../lib/api.js';

export interface CompilerCatalogHistorySectionProps {
  catalog: CatalogEntry[] | null;
  catalogLoading: boolean;
  catalogErr: string | null;
  catalogDeployingId: string | null;
  signer: unknown;
  isCore: boolean;
  loadCatalog: () => void;
  deployFromCatalog: (entry: CatalogEntry) => void;
  history: DeployLogEntry[];
  clearHistory: () => void;
}

export function CompilerCatalogHistorySection({
  catalog,
  catalogLoading,
  catalogErr,
  catalogDeployingId,
  signer,
  isCore,
  loadCatalog,
  deployFromCatalog,
  history,
  clearHistory,
}: CompilerCatalogHistorySectionProps) {
  return (
    <>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ marginTop: 0, marginBottom: 0 }}>Prepackaged contracts</h3>
          <button
            type="button"
            className="small secondary"
            onClick={loadCatalog}
            disabled={catalogLoading || !!catalog}
          >
            {catalog ? 'Loaded' : catalogLoading ? 'Loading…' : 'Load catalog'}
          </button>
        </div>
        <p className="muted small" style={{ marginTop: 4 }}>
          Backend pre-compiles every registered template at{' '}
          <code className="mono">/compile/catalog</code>. Bytecode + ABI are returned ready to
          deploy without re-running solc.
        </p>
        {catalogErr && <p className="error">{catalogErr}</p>}
        {catalog?.map((entry) => (
          <CatalogEntryRow
            key={entry.templateId}
            entry={entry}
            signer={signer}
            catalogDeployingId={catalogDeployingId}
            isCore={isCore}
            deployFromCatalog={deployFromCatalog}
          />
        ))}
      </div>
      {history.length > 0 && <DeployHistory history={history} clearHistory={clearHistory} />}
    </>
  );
}

function CatalogEntryRow({
  entry,
  signer,
  catalogDeployingId,
  isCore,
  deployFromCatalog,
}: {
  entry: CatalogEntry;
  signer: unknown;
  catalogDeployingId: string | null;
  isCore: boolean;
  deployFromCatalog: (entry: CatalogEntry) => void;
}) {
  return (
    <div
      className="row"
      style={{
        alignItems: 'center',
        gap: 8,
        padding: '6px 0',
        borderTop: '1px solid var(--bg-soft, rgba(255,255,255,0.05))',
        flexWrap: 'wrap',
      }}
    >
      <strong style={{ flex: '1 1 200px' }}>{entry.name}</strong>
      <span className="muted small">solc {entry.solcVersion}</span>
      <span className="muted small">{entry.bytecode.length} chars</span>
      <button
        type="button"
        className="primary small"
        disabled={!signer || catalogDeployingId === entry.templateId}
        onClick={() => deployFromCatalog(entry)}
        title={!signer ? 'Connect a wallet first' : 'Deploy to active chain'}
      >
        {catalogDeployingId === entry.templateId
          ? 'Deploying…'
          : `Deploy ${isCore ? 'Core' : 'eSpace'}`}
      </button>
      <p className="muted small" style={{ flex: '1 1 100%', margin: 0 }}>
        {entry.description}
      </p>
    </div>
  );
}

function DeployHistory({
  history,
  clearHistory,
}: {
  history: DeployLogEntry[];
  clearHistory: () => void;
}) {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ marginTop: 0, marginBottom: 0 }}>
          Deploy log <span className="muted">({history.length})</span>
        </h3>
        <button
          type="button"
          className="small secondary"
          onClick={clearHistory}
          title="Clear deploy history (sessionStorage only)"
        >
          Clear
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12 }}>
        Survives tab switches and page reloads (sessionStorage). Click an address to copy.
      </p>
      <ul className="acct-list" style={{ fontSize: 12 }}>
        {history.map((entry) => (
          <li key={entry.id} style={{ flexWrap: 'wrap' }}>
            <span className="muted small">
              {new Date(entry.ts).toLocaleTimeString()} · {entry.contractName} ·{' '}
              <span className={`space-badge space-${entry.family}`}>
                {entry.family === 'core' ? 'C' : 'E'}
              </span>{' '}
              {entry.chainName}
            </span>
            <button
              type="button"
              className="link"
              onClick={() => void navigator.clipboard.writeText(entry.address)}
              title="Copy address"
            >
              copy addr
            </button>
            <code className="mono small" style={{ wordBreak: 'break-all', flex: '1 1 100%' }}>
              {entry.address}
            </code>
          </li>
        ))}
      </ul>
    </div>
  );
}
