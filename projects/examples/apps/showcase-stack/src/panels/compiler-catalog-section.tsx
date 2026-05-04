import type { CatalogEntry } from '../lib/api.js';

export interface CompilerCatalogSectionProps {
  showCatalog: boolean;
  catalogLoading: boolean;
  catalogErr: string | null;
  catalog: CatalogEntry[] | null;
  catalogDeployHash: string | null;
  isConnected: boolean;
  setShowCatalog: (updater: (value: boolean) => boolean) => void;
  loadCatalog: () => void;
  deployCatalogEntry: (entry: CatalogEntry) => void;
}

export function CompilerCatalogSection({
  showCatalog,
  catalogLoading,
  catalogErr,
  catalog,
  catalogDeployHash,
  isConnected,
  setShowCatalog,
  loadCatalog,
  deployCatalogEntry,
}: CompilerCatalogSectionProps) {
  return (
    <div style={{ marginTop: 32 }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Pre-compiled catalog</h3>
        <button
          type="button"
          className="secondary"
          style={{ marginLeft: 'auto', fontSize: 11 }}
          disabled={catalogLoading}
          onClick={() => {
            setShowCatalog((value) => !value);
            if (!catalog) loadCatalog();
          }}
        >
          {showCatalog ? 'Hide' : 'Load catalog'}
        </button>
      </div>
      {showCatalog && (
        <>
          {catalogLoading && <div className="muted">Loading…</div>}
          {catalogErr && (
            <div className="result" style={{ color: 'var(--err)' }}>
              {catalogErr}
            </div>
          )}
          {catalog?.map((entry) => (
            <div key={entry.templateId} className="panel" style={{ marginBottom: 10 }}>
              <div className="row">
                <strong style={{ fontSize: 13 }}>{entry.name}</strong>
                <span className="muted" style={{ fontSize: 11 }}>
                  {entry.contractName} · solc {entry.solcVersion}
                </span>
                {isConnected && (
                  <button
                    type="button"
                    className="primary"
                    style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: 11 }}
                    onClick={() => deployCatalogEntry(entry)}
                  >
                    Deploy
                  </button>
                )}
              </div>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
                {entry.description}
              </p>
            </div>
          ))}
          {catalogDeployHash && (
            <div className="panel">
              <div className="muted" style={{ fontSize: 11 }}>
                Catalog deploy tx
              </div>
              <span className="mono" style={{ fontSize: 12 }}>
                {catalogDeployHash}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
