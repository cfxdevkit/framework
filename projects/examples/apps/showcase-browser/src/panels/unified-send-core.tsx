import { parseCFX } from '@cfxdevkit/core';
import { ConnectWall, CopyButton, errMsg } from '@cfxdevkit/example-showcase-ui';
import { useEffect, useState } from 'react';
import { getFluentProvider, useCoreWallet } from '../lib/use-core-wallet.js';

interface TxStatus {
  hash: string;
  packed: boolean;
  blockHash: string | null;
  status: number | null;
}

export function CoreSection() {
  const { status, address: account, isDetecting, isConnecting, connect } = useCoreWallet();
  const [connecting, setConnecting] = useState(false);
  const [connectErr, setConnectErr] = useState<string | null>(null);
  const [to, setTo] = useState('');
  const [valueCfx, setValueCfx] = useState('0');
  const [data, setData] = useState('0x');
  const [busy, setBusy] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus | null>(null);

  useEffect(() => {
    if (account && !to) setTo(account);
  }, [account, to]);

  useEffect(() => {
    const p = getFluentProvider();
    if (!txStatus || !p) return;
    if (txStatus.packed && txStatus.status !== null) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const tx = (await p.request({
          method: 'cfx_getTransactionByHash',
          params: [txStatus.hash],
        })) as null | { blockHash: string | null; status: string | null };
        if (cancelled || !tx) return;
        const next: TxStatus = {
          hash: txStatus.hash,
          packed: tx.blockHash !== null,
          blockHash: tx.blockHash,
          status: tx.status === null ? null : Number.parseInt(tx.status, 16),
        };
        setTxStatus((prev) => (prev?.hash === next.hash ? next : prev));
      } catch {
        // ignore transient polling errors
      }
    };
    void tick();
    const t = setInterval(() => void tick(), 2_500);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [txStatus]);

  const doConnect = async () => {
    setConnectErr(null);
    setConnecting(true);
    try {
      await connect();
    } catch (e) {
      setConnectErr(errMsg(e));
    } finally {
      setConnecting(false);
    }
  };

  const send = async () => {
    if (!account) return;
    setSendErr(null);
    setTxStatus(null);
    setBusy(true);
    const dest = to.trim() || account;
    let value: bigint;
    try {
      value = parseCFX(valueCfx.trim() || '0');
    } catch (e) {
      setSendErr(`Invalid value: ${errMsg(e)}`);
      setBusy(false);
      return;
    }
    const p = getFluentProvider();
    if (!p) {
      setSendErr('Fluent Core provider not found');
      setBusy(false);
      return;
    }
    try {
      const hash = (await p.request({
        method: 'cfx_sendTransaction',
        params: [
          { from: account, to: dest, value: `0x${value.toString(16)}`, data: data.trim() || '0x' },
        ],
      })) as string;
      setTxStatus({ hash, packed: false, blockHash: null, status: null });
    } catch (e) {
      setSendErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dual-col">
      <div className="dual-col-title">
        <span className="space-badge space-core">Core</span>
        Core send
      </div>
      <ConnectWall
        title="Core"
        status={status}
        walletName="Fluent Core"
        onConnect={() => void doConnect()}
        connecting={connecting || isDetecting || isConnecting}
      >
        <label>
          to{' '}
          <span className="muted" style={{ fontSize: 11 }}>
            (blank → self)
          </span>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder={account ?? 'cfx:a…'}
            spellCheck={false}
          />
        </label>
        <div className="row" style={{ marginTop: 8 }}>
          <label style={{ flex: 1 }}>
            value (CFX)
            <input value={valueCfx} onChange={(e) => setValueCfx(e.target.value)} />
          </label>
          <label style={{ flex: 1 }}>
            data
            <input value={data} onChange={(e) => setData(e.target.value)} spellCheck={false} />
          </label>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" className="primary" disabled={busy} onClick={() => void send()}>
            {busy ? 'Awaiting wallet…' : 'Send'}
          </button>
        </div>
        {sendErr && (
          <div style={{ color: 'var(--err)', fontSize: 12, marginTop: 6 }}>{sendErr}</div>
        )}
        {txStatus && (
          <div className="result">
            hash : {txStatus.hash} <CopyButton text={txStatus.hash} />
            {'\n'}packed : {txStatus.packed ? `✓ ${txStatus.blockHash ?? ''}` : 'waiting…'}
            {'\n'}status :{' '}
            {txStatus.status === null
              ? 'pending'
              : txStatus.status === 0
                ? '✓ success'
                : '✗ reverted'}
          </div>
        )}
      </ConnectWall>
      {connectErr && <div style={{ color: 'var(--err)', fontSize: 12 }}>{connectErr}</div>}
    </div>
  );
}
