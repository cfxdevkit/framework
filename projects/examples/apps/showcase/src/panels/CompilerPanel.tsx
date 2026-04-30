/**
 * CompilerPanel — exercises `@cfxdevkit/compiler` end-to-end via the
 * showcase backend (`/compile/*`) and the framework deploy helper
 * (`@cfxdevkit/contracts/deploy`).
 *
 * Solidity compilation is Node-only (solc binaries, `node:crypto`), so the
 * showcase app delegates to `@cfxdevkit/example-showcase-backend`.
 *
 * Three modes:
 *
 * 1. **Pick a template** — choose from the curated registry, fill
 *    constructor args, hit Compile. Templates ship their full Solidity
 *    source inline (loaded into the editor below).
 * 2. **Live edit + recompile** — the source editor is editable; when the
 *    user changes it, Compile switches from the template route to
 *    `/compile/sources` so arbitrary edits are accepted.
 * 3. **Prepackaged contracts** — the backend pre-compiles every template
 *    and exposes them at `/compile/catalog`. The bytecode + ABI come down
 *    once and can be deployed without re-running solc.
 *
 * Works on both Core Space and eSpace — `deployContract` dispatches by
 * `client.family`. Compile + deploy state survives tab switches via
 * `<CompilerSessionProvider>` and persists to localStorage.
 */

import { deployContract } from '@cfxdevkit/contracts/deploy';
import { parseUnits } from '@cfxdevkit/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Abi, Hex } from 'viem';
import { useChain } from '../contexts/ChainProvider.js';
import { useCompilerSession } from '../contexts/CompilerSession.js';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { useWallet } from '../contexts/WalletProvider.js';
import { api, type CatalogEntry, type TemplateMetaResponse } from '../lib/api.js';

/** Convert a user-typed string to the value `viem` expects for a Solidity type. */
function coerceArg(type: string, raw: string): unknown {
  if (type === 'string') return raw;
  if (type === 'bool') return raw === 'true' || raw === '1';
  if (type === 'address') return raw as Hex;
  // Unsigned ints — `decimals_` for ERC-20 is `uint8`. Use BigInt to be safe.
  if (type.startsWith('uint') || type.startsWith('int')) return BigInt(raw);
  // Generic fallback: pass through.
  return raw;
}

export function CompilerPanel() {
  const { signer, accounts, activeIndex, connect } = useWallet();
  const { chain, client } = useChain();
  const { network } = useNetwork();
  const {
    artifact,
    setArtifact,
    selected,
    setSelected,
    argValues,
    setArgValues,
    history,
    pushDeploy,
    clearHistory,
  } = useCompilerSession();

  const [templates, setTemplates] = useState<TemplateMetaResponse[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [compileErr, setCompileErr] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [deployErr, setDeployErr] = useState<string | null>(null);
  const [deployedHash, setDeployedHash] = useState<string | null>(null);

  // Editable source per template path. Initialised from the template's
  // inline source on first load; user edits drive `/compile/sources`.
  const [sourceEdit, setSourceEdit] = useState<Record<string, string>>({});

  // Prepackaged-catalog state (lazy fetched the first time the user opens
  // that section).
  const [catalog, setCatalog] = useState<CatalogEntry[] | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogErr, setCatalogErr] = useState<string | null>(null);
  const [catalogDeployingId, setCatalogDeployingId] = useState<string | null>(null);

  const isCore = chain.family === 'core';

  useEffect(() => {
    const ac = new AbortController();
    api
      .compileTemplates(ac.signal)
      .then((r) => {
        setTemplates(r.templates);
        const first = r.templates[0];
        // Only assign defaults if the user hasn't picked anything yet (i.e.
        // the session is fresh). Don't clobber a user choice that was
        // restored from sessionStorage.
        if (first && !selected) {
          setSelected(first.id);
          if (first.id === 'basic-erc20' && Object.keys(argValues).length === 0) {
            setArgValues({
              name_: 'Showcase Token',
              symbol_: 'SHOW',
              decimals_: '18',
              initialSupply: '1000000',
            });
          }
        }
      })
      .catch((e: unknown) => {
        if ((e as { name?: string }).name === 'AbortError') return;
        setLoadErr(e instanceof Error ? e.message : String(e));
      });
    return () => ac.abort();
    // Intentionally only run once on mount; the deps would cause re-fetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSelected, setArgValues, selected, argValues]);

  const tpl = templates?.find((t) => t.id === selected) ?? null;

  // Hydrate the source editor from the active template the first time it's
  // selected (or after a template swap). Only set entries we don't already
  // have so user edits aren't clobbered by re-renders.
  useEffect(() => {
    if (!tpl) return;
    setSourceEdit((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const s of tpl.sources) {
        if (next[s.path] === undefined) {
          next[s.path] = s.content;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tpl]);

  // True when the editor differs from the template's pristine sources.
  const sourceDirty = useMemo(() => {
    if (!tpl) return false;
    return tpl.sources.some((s) => (sourceEdit[s.path] ?? s.content) !== s.content);
  }, [tpl, sourceEdit]);

  const resetSource = useCallback(() => {
    if (!tpl) return;
    setSourceEdit((prev) => {
      const next = { ...prev };
      for (const s of tpl.sources) next[s.path] = s.content;
      return next;
    });
  }, [tpl]);

  const compile = useCallback(async () => {
    if (!selected || !tpl) return;
    setCompiling(true);
    setCompileErr(null);
    setArtifact(null);
    setDeployedHash(null);
    setDeployErr(null);
    try {
      const out = sourceDirty
        ? await api.compileSources({
            sources: tpl.sources.map((s) => ({
              path: s.path,
              content: sourceEdit[s.path] ?? s.content,
            })),
            contractName: tpl.contractName,
            solcVersion: tpl.solcVersion,
            evmVersion: 'paris',
          })
        : await api.compile({ templateId: selected });
      setArtifact(out);
    } catch (e) {
      setCompileErr(e instanceof Error ? e.message : String(e));
    } finally {
      setCompiling(false);
    }
  }, [selected, tpl, sourceDirty, sourceEdit, setArtifact]);

  const deploy = useCallback(async () => {
    if (!signer || !artifact || !tpl) {
      setDeployErr('Compile first and connect a wallet on the Wallet tab.');
      return;
    }
    setDeploying(true);
    setDeployErr(null);
    setDeployedHash(null);
    try {
      const args = tpl.constructorArgs.map((a) => {
        const raw = argValues[a.name] ?? '';
        // Special-case ERC-20 initialSupply — assume the user types in whole
        // tokens at the chosen `decimals_`.
        if (a.name === 'initialSupply') {
          const decimals = Number(argValues.decimals_ ?? '18');
          return parseUnits(raw || '0', decimals);
        }
        return coerceArg(a.type, raw);
      });
      const result = await deployContract({
        client,
        signer,
        abi: artifact.abi as Abi,
        bytecode: artifact.bytecode as Hex,
        args: args as never,
        waitForReceipt: true,
      });
      setDeployedHash(result.hash);
      if (result.address) {
        pushDeploy({
          templateId: tpl.id,
          contractName: artifact.contractName,
          chainName: chain.name,
          family: chain.family as 'core' | 'espace',
          chainId: chain.id,
          networkId: network.id,
          address: result.address,
          hash: result.hash,
          deployer: signer.account.address,
          constructorArgs: args.map((v) => (typeof v === 'bigint' ? v.toString() : v)),
          abi: artifact.abi as Abi,
        });
      }
    } catch (e) {
      setDeployErr(e instanceof Error ? e.message : String(e));
    } finally {
      setDeploying(false);
    }
  }, [signer, artifact, tpl, argValues, client, chain, network, pushDeploy]);

  /** Lazy-load the prepackaged catalog the first time the user expands it. */
  const loadCatalog = useCallback(async () => {
    if (catalog || catalogLoading) return;
    setCatalogLoading(true);
    setCatalogErr(null);
    try {
      const r = await api.compileCatalog();
      setCatalog(r.entries);
    } catch (e) {
      setCatalogErr(e instanceof Error ? e.message : String(e));
    } finally {
      setCatalogLoading(false);
    }
  }, [catalog, catalogLoading]);

  /**
   * Deploy a prepackaged entry directly. Constructor args are pulled from
   * the same `argValues` shared state so users can prefill them once and
   * apply across templates.
   */
  const deployFromCatalog = useCallback(
    async (entry: CatalogEntry) => {
      if (!signer) {
        setDeployErr('Connect a wallet on the Wallet tab.');
        return;
      }
      setCatalogDeployingId(entry.templateId);
      setDeployErr(null);
      try {
        const args = entry.constructorArgs.map((a) => {
          const raw = argValues[a.name] ?? '';
          if (a.name === 'initialSupply') {
            const decimals = Number(argValues.decimals_ ?? '18');
            return parseUnits(raw || '0', decimals);
          }
          return coerceArg(a.type, raw);
        });
        const result = await deployContract({
          client,
          signer,
          abi: entry.abi as Abi,
          bytecode: entry.bytecode as Hex,
          args: args as never,
          waitForReceipt: true,
        });
        if (result.address) {
          pushDeploy({
            templateId: entry.templateId,
            contractName: entry.contractName,
            chainName: chain.name,
            family: chain.family as 'core' | 'espace',
            chainId: chain.id,
            networkId: network.id,
            address: result.address,
            hash: result.hash,
            deployer: signer.account.address,
            constructorArgs: args.map((v) => (typeof v === 'bigint' ? v.toString() : v)),
            abi: entry.abi as Abi,
          });
        }
      } catch (e) {
        setDeployErr(e instanceof Error ? e.message : String(e));
      } finally {
        setCatalogDeployingId(null);
      }
    },
    [signer, client, chain, network, argValues, pushDeploy],
  );

  return (
    <section className="panel">
      <h2>Compile + deploy</h2>
      <p className="panel-desc">
        Drives <code className="mono">@cfxdevkit/compiler</code> server-side via{' '}
        <code className="mono">/compile</code> on{' '}
        <code className="mono">@cfxdevkit/example-showcase-backend</code> (solc is Node-only), then
        deploys the resulting bytecode using{' '}
        <code className="mono">@cfxdevkit/contracts/deploy</code> with the active wallet signer.
        Bytecode targets <code className="mono">evmVersion: 'paris'</code> so it runs on both
        Conflux Core Space and eSpace. Compile + deploy state survives tab switches via{' '}
        <code className="mono">CompilerSessionProvider</code>.
      </p>

      {loadErr && <p className="error">Failed to load templates: {loadErr}</p>}
      {!templates && !loadErr && <p className="muted">Loading templates…</p>}

      {templates && templates.length > 0 && (
        <>
          <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
            <label style={{ flex: 1 }}>
              <span>Template</span>
              <select value={selected} onChange={(e) => setSelected(e.target.value)}>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (solc {t.solcVersion})
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="primary"
              onClick={compile}
              disabled={compiling || !selected}
            >
              {compiling ? 'Compiling…' : 'Compile'}
            </button>
          </div>

          {tpl && (
            <p className="muted" style={{ marginTop: 8 }}>
              {tpl.description}
            </p>
          )}

          {tpl && tpl.sources.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div
                className="row"
                style={{ justifyContent: 'space-between', alignItems: 'center' }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 0 }}>
                  Source <span className="muted">({tpl.sources[0]?.path})</span>
                </h3>
                <div className="row" style={{ gap: 6 }}>
                  {sourceDirty && (
                    <span
                      className="space-badge"
                      title="edited"
                      style={{ background: 'var(--err)' }}
                    >
                      edited
                    </span>
                  )}
                  <button
                    type="button"
                    className="small secondary"
                    onClick={resetSource}
                    disabled={!sourceDirty}
                    title="Restore the template's pristine source"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <p className="muted small" style={{ marginTop: 4 }}>
                Edit and click Compile to recompile via{' '}
                <code className="mono">/compile/sources</code>. Otherwise the cached template
                bytecode from <code className="mono">/compile</code> is used.
              </p>
              {tpl.sources.map((s) => (
                <textarea
                  key={s.path}
                  value={sourceEdit[s.path] ?? s.content}
                  onChange={(e) => setSourceEdit((prev) => ({ ...prev, [s.path]: e.target.value }))}
                  spellCheck={false}
                  rows={Math.min(
                    28,
                    Math.max(10, (sourceEdit[s.path] ?? s.content).split('\n').length),
                  )}
                  style={{
                    width: '100%',
                    fontFamily: 'var(--mono, monospace)',
                    fontSize: 12,
                    marginTop: 6,
                  }}
                />
              ))}
            </div>
          )}

          {tpl && tpl.constructorArgs.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>Constructor args</h3>
              {tpl.constructorArgs.map((a) => (
                <label key={a.name} style={{ display: 'block', marginBottom: 8 }}>
                  <span>
                    {a.name} <span className="muted">({a.type})</span>
                  </span>
                  <input
                    type="text"
                    value={argValues[a.name] ?? ''}
                    onChange={(e) =>
                      setArgValues((prev) => ({ ...prev, [a.name]: e.target.value }))
                    }
                    spellCheck={false}
                    autoCapitalize="off"
                  />
                </label>
              ))}
            </div>
          )}

          {compileErr && <p className="error">{compileErr}</p>}

          {artifact && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>
                Compiled <span className="muted">({artifact.contractName})</span>
                {artifact.cached && (
                  <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>
                    cached
                  </span>
                )}
              </h3>
              <dl className="kv">
                <dt>inputHash</dt>
                <dd className="mono" style={{ fontSize: 11, wordBreak: 'break-all' }}>
                  {artifact.inputHash}
                </dd>
                <dt>bytecode</dt>
                <dd className="mono" style={{ fontSize: 11 }}>
                  {artifact.bytecode.length} chars
                </dd>
                <dt>abi entries</dt>
                <dd>{artifact.abi.length}</dd>
                <dt>warnings</dt>
                <dd>{artifact.warnings.length}</dd>
              </dl>

              <div className="row" style={{ gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  className="primary"
                  onClick={deploy}
                  disabled={deploying || !signer}
                >
                  {deploying
                    ? 'Deploying…'
                    : `Deploy to ${chain.name} (${isCore ? 'Core' : 'eSpace'})`}
                </button>
              </div>

              {!signer && (
                <p className="muted" style={{ marginTop: 8 }}>
                  No wallet connected.{' '}
                  {accounts.length > 0 ? (
                    <button
                      type="button"
                      className="link"
                      onClick={() => connect(0)}
                      style={{
                        background: 'none',
                        border: 0,
                        padding: 0,
                        color: 'var(--accent-1)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                    >
                      Connect account [0]
                    </button>
                  ) : (
                    <span>Open the Wallet tab to derive accounts from the active mnemonic.</span>
                  )}{' '}
                  to enable deploy.
                  {activeIndex !== null && ` (Active index: ${activeIndex})`}
                </p>
              )}

              {deployErr && <p className="error">{deployErr}</p>}
              {deployedHash && (
                <div className="result" style={{ marginTop: 12 }}>
                  <div>
                    <strong>tx submitted:</strong>{' '}
                    <code className="mono" style={{ fontSize: 11 }}>
                      {deployedHash}
                    </code>
                  </div>
                  <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                    Address (when receipt available) is recorded in the deploy log below.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="card" style={{ marginTop: 16 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ marginTop: 0, marginBottom: 0 }}>Prepackaged contracts</h3>
              <button
                type="button"
                className="small secondary"
                onClick={() => void loadCatalog()}
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
              <div
                key={entry.templateId}
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
                  onClick={() => void deployFromCatalog(entry)}
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
            ))}
          </div>

          {history.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div
                className="row"
                style={{ justifyContent: 'space-between', alignItems: 'center' }}
              >
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
                {history.map((h) => (
                  <li key={h.id} style={{ flexWrap: 'wrap' }}>
                    <span className="muted small">
                      {new Date(h.ts).toLocaleTimeString()} · {h.contractName} ·{' '}
                      <span className={`space-badge space-${h.family}`}>
                        {h.family === 'core' ? 'C' : 'E'}
                      </span>{' '}
                      {h.chainName}
                    </span>
                    <button
                      type="button"
                      className="link"
                      onClick={() => void navigator.clipboard.writeText(h.address)}
                      title="Copy address"
                    >
                      copy addr
                    </button>
                    <code
                      className="mono small"
                      style={{ wordBreak: 'break-all', flex: '1 1 100%' }}
                    >
                      {h.address}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
