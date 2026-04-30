/**
 * UnifiedSendPanel — send CFX on both spaces side-by-side.
 *
 * Left column  → eSpace send via wagmi (useSendTransaction + receipt polling)
 * Right column → Core send via Fluent (sendTransaction + cfx_getTransactionByHash polling)
 *
 * Each column shows an inline ConnectWall when the wallet is not active.
 */
import { parseCFX } from '@cfxdevkit/core';
import { ConnectWall, CopyButton, errMsg, WalletPickerModal } from '@cfxdevkit/example-showcase-ui';
import { useEffect, useState } from 'react';
import { type Address, type Hex, isAddress, parseEther } from 'viem';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { getFluentProvider, useCoreWallet } from '../lib/use-core-wallet.js';

// ── eSpace send section ───────────────────────────────────────────────

function ESpaceSection() {
  const { address, isConnected } = useAccount();
  const [pickerOpen, setPickerOpen] = useState(false);
  const walletStatus = isConnected ? 'active' : 'not-active';

  const [to, setTo] = useState('');
  const [valueCfx, setValueCfx] = useState('0');
  const [data, setData] = useState('0x');
  const [hash, setHash] = useState<Hex | null>(null);
  const [sendErr, setSendErr] = useState<string | null>(null);

  const { sendTransactionAsync, isPending } = useSendTransaction();
  const { data: receipt, isLoading: waitingReceipt } = useWaitForTransactionReceipt({
    hash: hash ?? undefined,
    query: { enabled: Boolean(hash) },
  });

  const send = async () => {
    if (!address) return;
    setSendErr(null);
    setHash(null);
    const dest = (to.trim() || address) as Address;
    const callData = (data.trim() || '0x') as Hex;
    if (!isAddress(dest)) {
      setSendErr(`Invalid address: ${dest}`);
      return;
    }
    let value: bigint;
    try {
      value = parseEther(valueCfx.trim() || '0');
    } catch (e) {
      setSendErr(`Invalid value: ${errMsg(e)}`);
      return;
    }
    try {
      const h = await sendTransactionAsync({ to: dest, value, data: callData });
      setHash(h);
    } catch (e) {
      setSendErr(errMsg(e));
    }
  };

  return (
    <div className="dual-col">
      <div className="dual-col-title">
        <span className="space-badge space-espace">eSpace</span>
        eSpace send
      </div>
      <ConnectWall
        title="eSpace"
        status={walletStatus}
        walletName="an eSpace wallet"
        onConnect={() => setPickerOpen(true)}
      >
        <label>
          to{' '}
          <span className="muted" style={{ fontSize: 11 }}>
            (blank → self)
          </span>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder={address ?? '0x…'}
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
          <button
            type="button"
            className="primary"
            disabled={isPending}
            onClick={() => void send()}
          >
            {isPending ? 'Awaiting wallet…' : 'Send'}
          </button>
          {waitingReceipt && (
            <span className="muted" style={{ fontSize: 12 }}>
              Waiting for receipt…
            </span>
          )}
        </div>
        {sendErr && (
          <div style={{ color: 'var(--err)', fontSize: 12, marginTop: 6 }}>{sendErr}</div>
        )}
        {hash && (
          <div className="result">
            hash : {hash} <CopyButton text={hash} />
            {'\n'}status :{' '}
            {receipt ? (receipt.status === 'success' ? '✓ success' : '✗ reverted') : '…confirming'}
            {receipt && (
              <>
                {'\n'}block : {receipt.blockNumber.toString()}
              </>
            )}
          </div>
        )}
      </ConnectWall>
      <WalletPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}

// ── Core send section ─────────────────────────────────────────────────

interface TxStatus {
  hash: string;
  packed: boolean;
  blockHash: string | null;
  status: number | null;
}

function CoreSection() {
  const { status, address: account, isDetecting, isConnecting, connect } = useCoreWallet();
  const [connecting, setConnecting] = useState(false);
  const [connectErr, setConnectErr] = useState<string | null>(null);

  const [to, setTo] = useState('');
  const [valueCfx, setValueCfx] = useState('0');
  const [data, setData] = useState('0x');
  const [busy, setBusy] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatus | null>(null);

  // Default `to` to connected account
  useEffect(() => {
    if (account && !to) setTo(account);
  }, [account, to]);

  // Poll receipt
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

// ── Main panel ─────────────────────────────────────────────────────────

export function UnifiedSendPanel() {
  return (
    <section className="panel">
      <h2>Send transaction</h2>
      <p className="panel-desc">
        <strong>eSpace</strong> — wagmi <code className="mono">useSendTransaction</code> + receipt
        watch. <strong>Core</strong> — Fluent <code className="mono">cfx_sendTransaction</code> +
        polling. Default: 0 CFX self-transfer (gas-only). Connect either wallet inline.
      </p>
      <div className="dual-cols">
        <ESpaceSection />
        <CoreSection />
      </div>
    </section>
  );
}
