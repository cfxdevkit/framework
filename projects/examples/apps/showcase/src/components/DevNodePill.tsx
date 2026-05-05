/**
 * `<DevNodePill>` — header chip that drives the showcase-backend's
 * `/devnode` lifecycle endpoints. Visible on every screen but only
 * actionable when the active network is `local` (the only network whose
 * RPCs point at the locally-spawned node).
 *
 * Polls `/devnode/status` every 5 s. Click expands a popover with
 * Start / Stop / Restart / Wipe controls.
 *
 * Genesis accounts are fetched on-demand via `/devnode/accounts` (no-store)
 * to avoid persisting private keys in polling state. A "Sync wallet" button
 * resets the keystore session back to the devnode seed mnemonic so the
 * connected accounts are always the funded genesis ones.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_SHOWCASE_MNEMONIC,
  useKeystoreSession,
} from '../contexts/KeystoreSessionProvider.js';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { api, type DevNodeAccountsResponse, type DevNodeStatusResponse } from '../lib/api.js';
import { DevNodePopoverContent } from './devnode-pill-popover.js';

const POLL_MS = 5_000;

type Action = 'start' | 'stop' | 'restart' | 'wipe' | null;

export function DevNodePill() {
  const { network } = useNetwork();
  const keystore = useKeystoreSession();
  const [status, setStatus] = useState<DevNodeStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Action>(null);
  const [accountsData, setAccountsData] = useState<DevNodeAccountsResponse | null>(null);
  const [accountsBusy, setAccountsBusy] = useState(false);
  const [accountsErr, setAccountsErr] = useState<string | null>(null);

  // Is the current keystore mnemonic the devnode seed?
  const isDefaultSeed = keystore.mnemonic.trim() === DEFAULT_SHOWCASE_MNEMONIC;

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const s = await api.devnodeStatus(signal);
      setStatus(s);
      setError(null);
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return;
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void refresh(ctrl.signal);
    const t = window.setInterval(() => void refresh(), POLL_MS);
    return () => {
      ctrl.abort();
      window.clearInterval(t);
    };
  }, [refresh]);

  const run = useCallback(
    async (action: Exclude<Action, null>) => {
      setBusy(action);
      setError(null);
      if (action !== 'start') setAccountsData(null); // clear on lifecycle changes
      try {
        if (action === 'start') setStatus(await api.devnodeStart({ mnemonic: keystore.mnemonic }));
        else if (action === 'stop') setStatus(await api.devnodeStop());
        else if (action === 'restart') setStatus(await api.devnodeRestart());
        else if (action === 'wipe') setStatus(await api.devnodeWipe());
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(null);
      }
    },
    [keystore.mnemonic],
  );

  const fetchAccounts = useCallback(async () => {
    setAccountsBusy(true);
    setAccountsErr(null);
    try {
      setAccountsData(await api.devnodeAccounts());
    } catch (e) {
      setAccountsErr(e instanceof Error ? e.message : String(e));
    } finally {
      setAccountsBusy(false);
    }
  }, []);

  /** Reset the keystore session to the devnode seed mnemonic and connect account 0. */
  const syncWallet = useCallback(() => {
    keystore.resetMnemonic();
    keystore.selectWallet(0);
  }, [keystore]);

  const offline = error !== null && status === null;

  const dot = useMemo(() => {
    if (offline) return 'red';
    const s = status?.status;
    if (s === 'running') return 'green';
    if (s === 'starting' || s === 'stopping') return 'amber';
    if (s === 'error') return 'red';
    return 'gray';
  }, [status, offline]);

  const label = (() => {
    if (busy === 'start') return 'devnode · starting…';
    if (busy === 'stop') return 'devnode · stopping…';
    if (busy === 'restart') return 'devnode · restarting…';
    if (busy === 'wipe') return 'devnode · wiping…';
    if (offline) return 'backend offline · :5174';
    if (!status) return 'devnode…';
    if (status.status === 'running' && status.urls)
      return `devnode · :${status.config?.evmRpcPort ?? '?'}/${status.config?.coreRpcPort ?? '?'}`;
    return `devnode · ${status.status}`;
  })();

  const isLocal = network.id === 'local';
  const sessionReady = keystore.status === 'ready' && keystore.active !== null;

  return (
    <div className={`pill-wrap ${isLocal ? '' : 'pill-muted'}`} title="Local devnode controls">
      <button
        type="button"
        className="pill"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`dot dot-${dot}`} aria-hidden />
        <span className="pill-label">{label}</span>
      </button>
      {open && (
        <DevNodePopoverContent
          isLocal={isLocal}
          sessionReady={sessionReady}
          offline={offline}
          error={error}
          status={status}
          busy={busy}
          isDefaultSeed={isDefaultSeed}
          syncWallet={syncWallet}
          run={run}
          refresh={refresh}
          accountsData={accountsData}
          accountsBusy={accountsBusy}
          accountsErr={accountsErr}
          fetchAccounts={fetchAccounts}
        />
      )}
    </div>
  );
}
