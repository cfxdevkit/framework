/**
 * CompilerPanel — compile Solidity via showcase-backend and deploy with a
 * connected browser wallet (eSpace only, via wagmi useDeployContract).
 *
 * Flow:
 *   1. GET /compile/templates → pick a template
 *   2. POST /compile or POST /compile/sources (if source was edited)
 *   3. useDeployContract (wagmi) → send deploy tx to eSpace
 *   4. Show contract address on receipt
 */

import { errMsg, WalletPickerModal } from '@cfxdevkit/example-showcase-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Abi, Hex } from 'viem';
import { useAccount, useDeployContract, useWaitForTransactionReceipt } from 'wagmi';
import {
  api,
  type CatalogEntry,
  type CompileTemplateResponse,
  type TemplateMetaResponse,
} from '../lib/api.js';

/** Convert a string arg to the solidity type expected by viem. */
function coerceArg(type: string, raw: string): unknown {
  if (type === 'string') return raw;
  if (type === 'bool') return raw === 'true' || raw === '1';
  if (type === 'address') return raw as Hex;
  if (type.startsWith('uint') || type.startsWith('int')) return BigInt(raw);
  return raw;
}

export function CompilerPanel() {
  const { address, isConnected } = useAccount();

  // Template list
  const [templates, setTemplates] = useState<TemplateMetaResponse[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');

  // Source editor
  const [sources, setSources] = useState<Record<string, string>>({});
  const [edited, setEdited] = useState(false);

  // Compile result
  const [artifact, setArtifact] = useState<CompileTemplateResponse | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [compileErr, setCompileErr] = useState<string | null>(null);

  // Constructor args
  const [argValues, setArgValues] = useState<Record<string, string>>({});

  // Deploy (wagmi)
  const { deployContractAsync } = useDeployContract();
  const [deployHash, setDeployHash] = useState<Hex | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [deployErr, setDeployErr] = useState<string | null>(null);
  const { data: receipt, isFetching: awaitingReceipt } = useWaitForTransactionReceipt({
    hash: deployHash ?? undefined,
  });

  // Catalog
  const [catalog, setCatalog] = useState<CatalogEntry[] | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogErr, setCatalogErr] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogDeployHash, setCatalogDeployHash] = useState<Hex | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    api
      .compileTemplates(ac.signal)
      .then((r) => {
        setTemplates(r.templates);
        const first = r.templates[0];
        if (first && !selectedId) {
          setSelectedId(first.id);
        }
      })
      .catch((e: unknown) => {
        if ((e as { name?: string }).name !== 'AbortError') {
          setLoadErr(errMsg(e));
        }
      });
    return () => ac.abort();
  }, [selectedId]);

  const tpl = useMemo(
    () => templates?.find((t) => t.id === selectedId) ?? null,
    [templates, selectedId],
  );

  // Hydrate source editor when template changes
  useEffect(() => {
    if (!tpl) return;
    const next: Record<string, string> = {};
    for (const s of tpl.sources) next[s.path] = s.content;
    setSources(next);
    setEdited(false);
    setArtifact(null);
    setCompileErr(null);
    setDeployHash(null);
    // Reset args
    const defaults: Record<string, string> = {};
    for (const arg of tpl.constructorArgs) defaults[arg.name] = '';
    setArgValues(defaults);
  }, [tpl]);

  const activeSource = Object.entries(sources)[0];

  const compile = useCallback(async () => {
    if (!tpl) return;
    setCompiling(true);
    setCompileErr(null);
    setArtifact(null);
    setDeployHash(null);
    try {
      let result: CompileTemplateResponse;
      if (edited) {
        result = await api.compileSources({
          sources: Object.entries(sources).map(([path, content]) => ({ path, content })),
          contractName: tpl.contractName,
          solcVersion: tpl.solcVersion,
        });
      } else {
        result = await api.compile({ templateId: tpl.id });
      }
      setArtifact(result);
    } catch (e) {
      setCompileErr(errMsg(e));
    } finally {
      setCompiling(false);
    }
  }, [tpl, edited, sources]);

  const deploy = useCallback(async () => {
    if (!artifact || !address) return;
    setDeploying(true);
    setDeployErr(null);
    setDeployHash(null);
    try {
      const abi = artifact.abi as Abi;
      const constructorDef = abi.find((x) => x.type === 'constructor') as
        | { inputs?: { name: string; type: string }[] }
        | undefined;
      const rawArgs: unknown[] = constructorDef?.inputs
        ? constructorDef.inputs.map((inp) => coerceArg(inp.type, argValues[inp.name] ?? ''))
        : [];
      const hash = await deployContractAsync({
        abi,
        bytecode: artifact.bytecode as Hex,
        args: rawArgs,
      });
      setDeployHash(hash);
    } catch (e) {
      setDeployErr(errMsg(e));
    } finally {
      setDeploying(false);
    }
  }, [artifact, address, argValues, deployContractAsync]);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogErr(null);
    try {
      const { entries } = await api.compileCatalog();
      setCatalog(entries);
    } catch (e) {
      setCatalogErr(errMsg(e));
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const deployCatalogEntry = useCallback(
    async (entry: CatalogEntry) => {
      if (!address) return;
      setDeployErr(null);
      setCatalogDeployHash(null);
      try {
        const abi = entry.abi as Abi;
        const hash = await deployContractAsync({
          abi,
          bytecode: entry.bytecode as Hex,
          args: [],
        });
        setCatalogDeployHash(hash);
      } catch (e) {
        setDeployErr(errMsg(e));
      }
    },
    [address, deployContractAsync],
  );

  return (
    <div>
      {/* Wallet check */}
      {!isConnected && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <p className="muted" style={{ margin: '0 0 10px' }}>
            Connect an eSpace wallet to deploy contracts.
          </p>
          <button type="button" className="primary" onClick={() => setPickerOpen(true)}>
            Connect eSpace Wallet
          </button>
          <WalletPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
        </div>
      )}

      {isConnected && (
        <div className="row" style={{ marginBottom: 16 }}>
          <span className="space-badge space-espace">eSpace</span>
          <span className="mono" style={{ fontSize: 12 }}>
            {address}
          </span>
        </div>
      )}

      {loadErr && (
        <div className="result" style={{ color: 'var(--err)' }}>
          {loadErr}
        </div>
      )}

      {/* Template picker */}
      {templates && (
        <label style={{ marginBottom: 16 }}>
          Template
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {tpl && (
        <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
          {tpl.description} · solc {tpl.solcVersion}
        </p>
      )}

      {/* Source editor */}
      {activeSource && (
        <label style={{ marginBottom: 16 }}>
          Source — {activeSource[0]}
          <textarea
            rows={12}
            value={activeSource[1]}
            onChange={(e) => {
              setSources((prev) => ({ ...prev, [activeSource[0]]: e.target.value }));
              setEdited(true);
              setArtifact(null);
            }}
            style={{ fontFamily: 'var(--mono)', fontSize: 11 }}
          />
        </label>
      )}

      {/* Compile button */}
      {tpl && (
        <div className="row" style={{ marginBottom: 16 }}>
          <button
            type="button"
            className="primary"
            disabled={compiling}
            onClick={() => void compile()}
          >
            {compiling ? 'Compiling…' : edited ? 'Compile (edited)' : 'Compile'}
          </button>
          {artifact && !edited && (
            <span className="muted" style={{ fontSize: 11 }}>
              {artifact.cached ? 'cached' : 'compiled'} · {artifact.bytecode.length / 2} bytes
            </span>
          )}
        </div>
      )}

      {compileErr && (
        <div className="result" style={{ color: 'var(--err)', marginBottom: 12 }}>
          {compileErr}
        </div>
      )}

      {/* Compiler warnings */}
      {artifact?.warnings.map((w) => (
        <div
          key={w.message.slice(0, 40)}
          className="warning"
          style={{ marginBottom: 8, color: w.severity === 'warning' ? 'var(--warn)' : undefined }}
        >
          {w.message}
        </div>
      ))}

      {/* Constructor args */}
      {artifact && tpl && tpl.constructorArgs.length > 0 && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600 }}>
            Constructor arguments
          </h3>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {tpl.constructorArgs.map((arg) => (
              <label key={arg.name}>
                {arg.name}: {arg.type}
                <input
                  value={argValues[arg.name] ?? ''}
                  onChange={(e) =>
                    setArgValues((prev) => ({ ...prev, [arg.name]: e.target.value }))
                  }
                  placeholder={arg.type}
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Deploy button */}
      {artifact && isConnected && (
        <div className="row" style={{ marginBottom: 16 }}>
          <button
            type="button"
            className="primary"
            disabled={deploying || awaitingReceipt}
            onClick={() => void deploy()}
          >
            {deploying ? 'Sending…' : awaitingReceipt ? 'Waiting for receipt…' : 'Deploy to eSpace'}
          </button>
        </div>
      )}

      {deployErr && (
        <div className="result" style={{ color: 'var(--err)', marginBottom: 12 }}>
          {deployErr}
        </div>
      )}

      {deployHash && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
            Transaction hash
          </div>
          <span className="mono" style={{ fontSize: 12 }}>
            {deployHash}
          </span>
        </div>
      )}

      {receipt && (
        <div className="panel" style={{ marginBottom: 16, borderColor: 'var(--accent-2)' }}>
          <h3
            style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--accent-2)' }}
          >
            Deployed
          </h3>
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
            Contract address
          </div>
          <span className="mono" style={{ fontSize: 12 }}>
            {receipt.contractAddress ?? '—'}
          </span>
        </div>
      )}

      {/* Catalog section */}
      <div style={{ marginTop: 32 }}>
        <div className="row" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Pre-compiled catalog</h3>
          <button
            type="button"
            className="secondary"
            style={{ marginLeft: 'auto', fontSize: 11 }}
            disabled={catalogLoading}
            onClick={() => {
              setShowCatalog((v) => !v);
              if (!catalog) void loadCatalog();
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
                      onClick={() => void deployCatalogEntry(entry)}
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
    </div>
  );
}
