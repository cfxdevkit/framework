/**
 * RawProvidersPanel — polls the global window for known wallet
 * provider injections every 800 ms. Useful first stop when debugging
 * "why isn't my wallet detected?" — surfaces the actual properties
 * each wallet writes to `window`.
 *
 *   window.ethereum   — generic EIP-1193 (MetaMask, OKX, …)
 *   window.fluent     — Fluent's eSpace/EVM provider (separate from
 *                       window.ethereum)
 *   window.conflux    — Fluent's Core-space provider (uses cfx_* RPC)
 *
 * Adapted from `devkit-workspace/templates/wallet-probe`.
 */

import { errMsg, LogBox, useLogList } from '@cfxdevkit/example-showcase-ui';
import { useEffect, useState } from 'react';

interface WindowInfo {
  ethereum_present: boolean;
  ethereum_isMetaMask: boolean;
  ethereum_isFluent: boolean;
  ethereum_providers_count: number;
  fluent_present: boolean;
  fluent_isFluent: boolean;
  conflux_present: boolean;
  conflux_isFluent: boolean;
  core_reload_counter: string;
  espace_fluent_reload_counter: string;
}

function snapshot(): WindowInfo {
  const w = window as unknown as Record<string, unknown>;
  const eth = w.ethereum as Record<string, unknown> | undefined;
  const fluent = w.fluent as Record<string, unknown> | undefined;
  const cfx = w.conflux as Record<string, unknown> | undefined;
  const providers = eth?.providers as unknown[] | undefined;
  return {
    ethereum_present: Boolean(eth),
    ethereum_isMetaMask: Boolean(eth?.isMetaMask),
    ethereum_isFluent: Boolean(eth?.isFluent),
    ethereum_providers_count: providers?.length ?? 0,
    fluent_present: Boolean(fluent),
    fluent_isFluent: Boolean(fluent?.isFluent),
    conflux_present: Boolean(cfx),
    conflux_isFluent: Boolean(cfx?.isFluent),
    core_reload_counter: sessionStorage.getItem('conflux-isFluent') ?? '(not set)',
    espace_fluent_reload_counter: sessionStorage.getItem('fluent-isFluent') ?? '(not set)',
  };
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="mono"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '3px 0',
        fontSize: 12,
      }}
    >
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function RawProvidersPanel() {
  const [info, setInfo] = useState<WindowInfo | null>(null);
  const { entries, log, clear } = useLogList();

  useEffect(() => {
    let prev = '';
    const tick = () => {
      const next = snapshot();
      const key = JSON.stringify(next);
      if (key !== prev) {
        prev = key;
        setInfo(next);
        log(
          `scan: conflux=${next.conflux_present} fluent=${next.fluent_present} ethereum=${next.ethereum_present}`,
        );
      }
    };
    tick();
    const t = window.setInterval(tick, 800);
    return () => window.clearInterval(t);
  }, [log]);

  const directCfxRequestAccounts = async () => {
    const w = window as unknown as Record<string, unknown>;
    const cfx = w.conflux as { request: (a: { method: string }) => Promise<unknown> } | undefined;
    if (!cfx) {
      log('window.conflux not found', 'error');
      return;
    }
    log('cfx_requestAccounts via window.conflux …');
    try {
      const res = await cfx.request({ method: 'cfx_requestAccounts' });
      log(`cfx_requestAccounts ✓ → ${JSON.stringify(res)}`, 'info');
    } catch (e) {
      log(`cfx_requestAccounts error: ${errMsg(e)}`, 'error');
    }
  };

  const clearCounters = () => {
    sessionStorage.removeItem('conflux-isFluent');
    sessionStorage.removeItem('fluent-isFluent');
    log('sessionStorage counters cleared — reloading in 300ms', 'warn');
    setTimeout(() => window.location.reload(), 300);
  };

  return (
    <section className="panel">
      <h2>Raw window scan</h2>
      <p className="panel-desc">
        Polled every 800 ms. Shows what providers are actually present on{' '}
        <code className="mono">window</code>. Use this to diagnose wallet detection issues before
        reaching for the higher-level hooks.
      </p>

      {info ? (
        <>
          <div style={{ marginTop: 8 }}>
            <strong style={{ fontSize: 12, color: 'var(--accent)' }}>window.ethereum</strong>
            <Row label="present" value={String(info.ethereum_present)} />
            <Row label="isMetaMask" value={String(info.ethereum_isMetaMask)} />
            <Row label="isFluent" value={String(info.ethereum_isFluent)} />
            <Row
              label="providers[]"
              value={
                info.ethereum_providers_count != null
                  ? `${info.ethereum_providers_count} entries`
                  : 'none'
              }
            />
          </div>
          <div style={{ marginTop: 8 }}>
            <strong style={{ fontSize: 12, color: 'var(--accent)' }}>window.fluent</strong>
            <Row label="present" value={String(info.fluent_present)} />
            <Row label="isFluent" value={String(info.fluent_isFluent)} />
          </div>
          <div style={{ marginTop: 8 }}>
            <strong style={{ fontSize: 12, color: 'var(--accent)' }}>window.conflux</strong>
            <Row label="present" value={String(info.conflux_present)} />
            <Row label="isFluent" value={String(info.conflux_isFluent)} />
          </div>
          <div style={{ marginTop: 8 }}>
            <strong style={{ fontSize: 12, color: 'var(--accent)' }}>
              sessionStorage counters (page-reload on -32602)
            </strong>
            <Row label="conflux-isFluent" value={info.core_reload_counter} />
            <Row label="fluent-isFluent" value={info.espace_fluent_reload_counter} />
          </div>
        </>
      ) : (
        <p className="muted">scanning…</p>
      )}

      <div className="row" style={{ marginTop: 12, gap: 8 }}>
        <button type="button" className="secondary" onClick={directCfxRequestAccounts}>
          Direct cfx_requestAccounts
        </button>
        <button type="button" className="secondary" onClick={clearCounters}>
          Clear counters + reload
        </button>
        <button type="button" className="secondary" onClick={clear}>
          Clear log
        </button>
      </div>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Events</h3>
      <LogBox entries={entries} />
    </section>
  );
}
