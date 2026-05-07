/**
 * UnifiedAccountPanel — account dashboard for both spaces in one view.
 *
 * Left column  → eSpace account (wagmi: address, balance, block, gas)
 * Right column → Core account (Fluent: address, balance, epoch, gas)
 *
 * Each column shows an inline ConnectWall when its wallet is not active,
 * with a connect button so the user does not have to scroll to the header.
 */
import { formatCFX, formatGDrip } from '@cfxdevkit/core';
import { ConnectWall, CopyButton, errMsg, WalletPickerModal } from '@cfxdevkit/example-showcase-ui';
import { useCallback, useEffect, useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount, useBalance, useBlockNumber, useGasPrice } from 'wagmi';
import { getFluentProvider, useCoreWallet } from '../lib/use-core-wallet.js';

// ── eSpace section ────────────────────────────────────────────────────

function ESpaceSection() {
  const { address, isConnected, connector } = useAccount();
  const chainId = useAccount().chainId;

  const {
    data: balance,
    refetch: refetchBalance,
    isFetching: balanceFetching,
  } = useBalance({
    address,
    query: { enabled: Boolean(address) },
  });
  const { data: blockNumber, refetch: refetchBlock } = useBlockNumber({
    query: { refetchInterval: 6_000 },
  });
  const { data: gasPrice } = useGasPrice({
    query: { refetchInterval: 12_000 },
  });

  // wagmi doesn't have the same status shape; synthesise it
  const walletStatus = isConnected ? 'active' : 'not-active';
  const [pickerOpen, setPickerOpen] = useState(false);

  // Import WalletPickerModal lazily to avoid circular deps — inline approach:
  // We use the ConnectWall with a no-op onConnect and show picker ourselves.
  const handleConnect = () => setPickerOpen(true);

  return (
    <div className="dual-col">
      <div className="dual-col-title">
        <span className="space-badge space-espace">eSpace</span>
        eSpace account
      </div>
      <ConnectWall
        title="eSpace"
        status={walletStatus}
        walletName="an eSpace wallet"
        onConnect={handleConnect}
      >
        <div className="result">
          address : {address} <CopyButton text={address ?? ''} />
          {'\n'}connector : {connector?.name ?? 'unknown'}
          {'\n'}chainId : {chainId ?? '—'}
          {'\n'}balance : {balance ? `${formatUnits(balance.value, balance.decimals)} ${balance.symbol}` : '…'}
          {'\n'}blockNumber : {blockNumber !== undefined ? blockNumber.toString() : '…'}
          {'\n'}gasPrice : {gasPrice !== undefined ? `${gasPrice.toString()} wei` : '…'}
        </div>
        <div className="row" style={{ marginTop: 8, gap: 6 }}>
          <button
            type="button"
            className="secondary"
            style={{ fontSize: 12 }}
            onClick={() => void refetchBalance()}
            disabled={balanceFetching}
          >
            {balanceFetching ? 'Refreshing…' : 'Refresh balance'}
          </button>
          <button
            type="button"
            className="secondary"
            style={{ fontSize: 12 }}
            onClick={() => void refetchBlock()}
          >
            Refresh block
          </button>
        </div>
      </ConnectWall>
      {pickerOpen && <WalletPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}

// ── Core section ──────────────────────────────────────────────────────

function CoreSection() {
  const {
    status,
    address: account,
    chainId,
    isDetecting,
    isConnecting,
    isConnected,
    connect,
  } = useCoreWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [epoch, setEpoch] = useState<string | null>(null);
  const [gasPrice, setGasPrice] = useState<string | null>(null);
  const [chainErr, setChainErr] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectErr, setConnectErr] = useState<string | null>(null);

  // Balance polling — cfx_getBalance returns hex drip
  useEffect(() => {
    if (!account || !isConnected) {
      setBalance(null);
      return;
    }
    const p = getFluentProvider();
    if (!p) return;
    const fetchBalance = async () => {
      try {
        const hex = (await p.request({
          method: 'cfx_getBalance',
          params: [account, 'latest_state'],
        })) as string;
        setBalance(hex);
      } catch {
        /* ignore */
      }
    };
    void fetchBalance();
    const t = setInterval(() => void fetchBalance(), 8_000);
    return () => clearInterval(t);
  }, [account, isConnected]);

  const refreshChainState = useCallback(async () => {
    const p = getFluentProvider();
    if (!p) return;
    setChainErr(null);
    try {
      const [head, gas] = await Promise.all([
        p.request({ method: 'cfx_epochNumber' }) as Promise<string>,
        p.request({ method: 'cfx_gasPrice' }) as Promise<string>,
      ]);
      setEpoch(BigInt(head).toString());
      setGasPrice(BigInt(gas).toString());
    } catch (e) {
      setChainErr(errMsg(e));
    }
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    void refreshChainState();
    const t = setInterval(() => void refreshChainState(), 6_000);
    return () => clearInterval(t);
  }, [isConnected, refreshChainState]);

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

  return (
    <div className="dual-col">
      <div className="dual-col-title">
        <span className="space-badge space-core">Core</span>
        Core account
      </div>
      <ConnectWall
        title="Core"
        status={status}
        walletName="Fluent Core"
        onConnect={() => void doConnect()}
        connecting={connecting || isDetecting || isConnecting}
      >
        <div className="result">
          address : {account} <CopyButton text={account ?? ''} />
          {'\n'}chainId : {chainId ?? 'unknown'}
          {'\n'}balance : {balance ? `${formatCFX(BigInt(balance))} CFX` : '…'}
          {'\n'}epoch : {epoch ?? '…'}
          {'\n'}gasPrice : {gasPrice ? `${formatGDrip(BigInt(gasPrice))} Gdrip` : '…'}
        </div>
        {chainErr && (
          <div style={{ color: 'var(--err)', fontSize: 12, marginTop: 4 }}>{chainErr}</div>
        )}
        <div className="row" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="secondary"
            style={{ fontSize: 12 }}
            onClick={() => void refreshChainState()}
          >
            Refresh epoch / gas
          </button>
        </div>
      </ConnectWall>
      {connectErr && <div style={{ color: 'var(--err)', fontSize: 12 }}>{connectErr}</div>}
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────

export function UnifiedAccountPanel() {
  return (
    <section className="panel">
      <h2>Account overview</h2>
      <p className="panel-desc">
        Read-only data from both spaces simultaneously. Connect either wallet to see its state —
        each section has an inline connect button.
      </p>
      <div className="dual-cols">
        <ESpaceSection />
        <CoreSection />
      </div>
    </section>
  );
}
