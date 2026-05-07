/**
 * CoreSendTxPanel — Conflux Core space CFX transfer via Fluent.
 *
 * Sends a CFX transaction through `cfx_sendTransaction` on `window.conflux`.
 * The wallet fills in
 * `from`, `nonce`, `gas`, `gasPrice`, `storageLimit`, and `epochHeight`.
 *
 * Defaults to a self-transfer of 0 CFX so the panel is safe to click on
 * a fresh devnet account. After dispatch we poll
 * `cfx_getTransactionByHash` for `~30s` to surface execution status —
 * Core txs become "executed" only after they're packed in a block AND the
 * deferred-execution window passes (≈5 epochs).
 */
import { parseCFX } from '@cfxdevkit/core';
import { CopyButton, errMsg } from '@cfxdevkit/example-showcase-ui';
import { useEffect, useState } from 'react';
import { fromHex, toHex } from 'viem';
import { getFluentProvider, useCoreWallet } from '../lib/use-core-wallet.js';

interface TxStatus {
  hash: string;
  packed: boolean;
  blockHash: string | null;
  status: number | null;
}

export function CoreSendTxPanel() {
  const { status, address: account, isConnected } = useCoreWallet();

  const [to, setTo] = useState('');
  const [valueCfx, setValueCfx] = useState('0');
  const [data, setData] = useState('0x');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus | null>(null);

  // Default `to` to the connected account once available.
  useEffect(() => {
    if (account && !to) setTo(account);
  }, [account, to]);

  // Poll the receipt while a tx is in flight.
  useEffect(() => {
    const provider = getFluentProvider();
    if (!txStatus || !provider) return;
    if (txStatus.packed && txStatus.status !== null) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const tx = (await provider.request({
          method: 'cfx_getTransactionByHash',
          params: [txStatus.hash],
        })) as null | { blockHash: string | null; status: string | null };
        if (cancelled || !tx) return;
        const next: TxStatus = {
          hash: txStatus.hash,
          packed: tx.blockHash !== null,
          blockHash: tx.blockHash,
          status: tx.status === null ? null : fromHex(tx.status as `0x${string}`, 'number'),
        };
        setTxStatus((prev) => (prev?.hash === next.hash ? next : prev));
      } catch {
        // ignore transient errors mid-poll
      }
    };
    void tick();
    const t = setInterval(() => void tick(), 2_500);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [txStatus]);

  if (!isConnected || !account) {
    return (
      <section className="panel">
        <h2>Core send transaction</h2>
        <p className="panel-desc">
          Connect via the <strong>Conflux Core · Fluent</strong> panel first.
        </p>
        <div className="result">status: {status ?? 'undefined'}</div>
      </section>
    );
  }

  const submit = async () => {
    setError(null);
    setTxStatus(null);
    setBusy(true);
    const provider = getFluentProvider();
    if (!provider) {
      setError('Fluent Core provider not found');
      setBusy(false);
      return;
    }
    try {
      const valueDrip = valueCfx.trim() === '' ? 0n : parseCFX(valueCfx.trim());
      const params: { from: string; to: string; value: string; data?: string } = {
        from: account,
        to: to.trim(),
        value: toHex(valueDrip),
      };
      const trimmedData = data.trim();
      if (trimmedData !== '' && trimmedData !== '0x') params.data = trimmedData;
      const hash = (await provider.request({
        method: 'cfx_sendTransaction',
        params: [params],
      })) as string;
      setTxStatus({ hash, packed: false, blockHash: null, status: null });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const renderStatusLabel = (s: TxStatus): string => {
    if (s.status === 0) return 'executed ✓';
    if (s.status === 1) return 'executed (vm-revert)';
    if (s.status === 2) return 'skipped';
    if (s.packed) return 'packed (awaiting deferred execution)';
    return 'pending in mempool';
  };

  return (
    <section className="panel">
      <h2>Core send transaction</h2>
      <p className="panel-desc">
        Calls <code className="mono">cfx_sendTransaction</code>; defaults to a self-transfer of 0
        CFX so it's safe to click without funding. After dispatch the receipt is polled via{' '}
        <code className="mono">cfx_getTransactionByHash</code> until the tx is executed (Core defers
        execution by ~5 epochs).
      </p>

      <label style={{ display: 'block', fontSize: 12, marginTop: 8 }}>
        to (base32)
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="cfx:aa…"
          style={{
            display: 'block',
            width: '100%',
            marginTop: 4,
            padding: 8,
            background: 'var(--panel-2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontFamily: 'var(--mono)',
            fontSize: 12,
          }}
        />
      </label>

      <label style={{ display: 'block', fontSize: 12, marginTop: 8 }}>
        value (CFX)
        <input
          value={valueCfx}
          onChange={(e) => setValueCfx(e.target.value)}
          inputMode="decimal"
          style={{
            display: 'block',
            width: '100%',
            marginTop: 4,
            padding: 8,
            background: 'var(--panel-2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontFamily: 'var(--mono)',
            fontSize: 12,
          }}
        />
      </label>

      <label style={{ display: 'block', fontSize: 12, marginTop: 8 }}>
        data (hex)
        <input
          value={data}
          onChange={(e) => setData(e.target.value)}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 4,
            padding: 8,
            background: 'var(--panel-2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontFamily: 'var(--mono)',
            fontSize: 12,
          }}
        />
      </label>

      <div className="row" style={{ gap: 8, marginTop: 12 }}>
        <button type="button" className="primary" disabled={busy} onClick={submit}>
          {busy ? 'Awaiting wallet…' : 'sendTransaction'}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setTo(account);
            setValueCfx('0');
            setData('0x');
            setTxStatus(null);
            setError(null);
          }}
          disabled={busy}
        >
          Reset
        </button>
      </div>

      {error && (
        <div className="result" style={{ color: 'var(--err)' }}>
          {error}
        </div>
      )}

      {txStatus && (
        <div className="result">
          hash : {txStatus.hash} <CopyButton text={txStatus.hash} />
          {'\n'}status : {renderStatusLabel(txStatus)}
          {'\n'}blockHash : {txStatus.blockHash ?? '…'}
        </div>
      )}
    </section>
  );
}
