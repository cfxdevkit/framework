/**
 * WalletBar — persistent header indicator for both wallet spaces.
 *
 * eSpace pill  — wagmi account (non-Fluent injected EIP-1193)
 * Core pill    — direct window.conflux connector
 *
 * Each pill validates the connected wallet's chainId against known chains
 * for that space. A wrong network shows an amber warning border and badge.
 */
import { formatCFX } from '@cfxdevkit/core';
import {
  CopyButton,
  type CoreChainConfig,
  coreChainLabel,
  deriveCoreState,
  errMsg,
  getFluentCoreProvider,
  useCoreWallet,
  WalletPickerModal,
} from '@cfxdevkit/example-showcase-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useAccount,
  useBalance,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from 'wagmi';
import { useNetwork } from '../contexts/NetworkProvider.js';

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function shortBase32(addr: string): string {
  const colon = addr.indexOf(':');
  if (colon !== -1) return `${addr.slice(0, colon + 1)}…${addr.slice(-6)}`;
  return `${addr.slice(0, 8)}…${addr.slice(-4)}`;
}

// ── eSpace pill ────────────────────────────────────────────────────────

function ESpacePill() {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { network } = useNetwork();
  const { data: balance } = useBalance({
    address,
    query: { enabled: Boolean(address), refetchInterval: 12_000 },
  });
  const [pickerOpen, setPickerOpen] = useState(false);

  const onCorrectChain = !isConnected || chainId === network.espace.id;

  const chainLabel =
    chainId === 1030
      ? 'eSpace'
      : chainId === 71
        ? 'eSpace Testnet'
        : chainId === 2030
          ? 'eSpace Local'
          : `chain ${chainId}`;

  const pillClass = `wallet-pill${isConnected ? (onCorrectChain ? ' pill-active' : ' pill-warn') : ''}`;

  return (
    <div className={pillClass}>
      <span className="space-badge space-espace" style={{ fontSize: 10, flexShrink: 0 }}>
        eSpace
      </span>
      {isConnected && address ? (
        <>
          {!onCorrectChain && (
            <span style={{ color: 'var(--warn, #ffb703)', fontSize: 10, fontWeight: 600 }}>
              ⚠ wrong network
            </span>
          )}
          <span className="mono" style={{ fontSize: 11 }}>
            {onCorrectChain && balance
              ? `${Number(balance.formatted).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${balance.symbol}`
              : '—'}
          </span>
          <span className="mono wallet-addr" title={address}>
            {shortAddr(address)}
          </span>
          <CopyButton text={address} />
          <span className="muted" style={{ fontSize: 10 }}>
            {connector?.name ?? '?'} · {chainLabel}
          </span>
          {!onCorrectChain && (
            <button
              type="button"
              className="warn"
              style={{ padding: '2px 7px', fontSize: 11 }}
              onClick={() => switchChain({ chainId: network.espace.id }, { onError: () => {} })}
            >
              Switch to {network.label}
            </button>
          )}
          <button
            type="button"
            className="secondary"
            style={{ padding: '2px 7px', fontSize: 11 }}
            title="Disconnect eSpace wallet"
            onClick={() => disconnect()}
          >
            ✕
          </button>
        </>
      ) : (
        <>
          <span className="muted" style={{ fontSize: 11 }}>
            not connected
          </span>
          <button
            type="button"
            className="primary"
            style={{ padding: '3px 10px', fontSize: 11 }}
            disabled={isConnecting}
            onClick={() => setPickerOpen(true)}
          >
            {isConnecting ? '…' : 'Connect'}
          </button>
          {connectError && (
            <span style={{ color: 'var(--err)', fontSize: 10 }}>{connectError.message}</span>
          )}
        </>
      )}
      <WalletPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} section="espace" />
    </div>
  );
}

// ── Core pill ──────────────────────────────────────────────────────────

function CorePill() {
  const { status, address: account, chainId, connect, disconnect, switchChain } = useCoreWallet();
  const { network } = useNetwork();
  const [balance, setBalance] = useState<string | null>(null);
  const [connectErr, setConnectErr] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'active' || !account) {
      setBalance(null);
      return;
    }
    const provider = getFluentCoreProvider();
    if (!provider) return;
    const fetchBalance = async () => {
      try {
        const nextBalance = (await provider.request({
          method: 'cfx_getBalance',
          params: [account, 'latest_state'],
        })) as string;
        setBalance(nextBalance);
      } catch {
        // ignore transient wallet/RPC failures while the header polls
      }
    };
    void fetchBalance();
    const timer = setInterval(() => void fetchBalance(), 8_000);
    return () => clearInterval(timer);
  }, [account, status]);

  // Convert the decimal ChainConfig.id to the hex string Fluent Core expects.
  const targetChainHex = `0x${network.core.id.toString(16)}`;

  const targetCoreChain = useMemo<CoreChainConfig>(
    () => ({
      coreChainId: network.core.id,
      chainIdHex: targetChainHex,
      label: network.core.displayName,
      rpcUrl: network.core.rpc.http[0] ?? 'http://127.0.0.1:12537',
      rpcUrls: [...network.core.rpc.http],
      ...(network.core.explorer?.url ? { blockExplorerUrl: network.core.explorer.url } : {}),
    }),
    [network.core, targetChainHex],
  );

  const { isPending, isActive, canConnect, onCorrectChain, showSwitch } = deriveCoreState(
    status,
    chainId ?? undefined,
    targetChainHex,
  );

  const chainLabelText = coreChainLabel(chainId ?? undefined);

  const doConnect = async () => {
    setConnectErr(null);
    try {
      await connect();
    } catch (err) {
      setConnectErr(errMsg(err));
    }
  };

  const doSwitchChain = useCallback(async () => {
    setConnectErr(null);
    try {
      await switchChain(targetCoreChain);
    } catch (err) {
      setConnectErr(errMsg(err));
    }
  }, [switchChain, targetCoreChain]);

  const pillClass = `wallet-pill${isActive ? (onCorrectChain ? ' pill-active' : ' pill-warn') : ''}`;

  return (
    <div className={pillClass}>
      <span className="space-badge space-core" style={{ fontSize: 10, flexShrink: 0 }}>
        Core
      </span>
      {isActive && account ? (
        <>
          {!onCorrectChain && (
            <span style={{ color: 'var(--warn, #ffb703)', fontSize: 10, fontWeight: 600 }}>
              ⚠ wrong network
            </span>
          )}
          <span className="mono" style={{ fontSize: 11 }}>
            {onCorrectChain && balance ? `${formatCFX(BigInt(balance))} CFX` : '—'}
          </span>
          <span className="mono wallet-addr" title={account}>
            {shortBase32(account)}
          </span>
          <CopyButton text={account} />
          <span className="muted" style={{ fontSize: 10 }}>
            Fluent · {chainLabelText}
          </span>
          {showSwitch && (
            <button
              type="button"
              className="warn"
              style={{ padding: '2px 7px', fontSize: 11 }}
              onClick={doSwitchChain}
            >
              Switch to {network.label}
            </button>
          )}
          <button
            type="button"
            className="secondary"
            style={{ padding: '2px 7px', fontSize: 11 }}
            title="Disconnect Core wallet"
            onClick={disconnect}
          >
            ✕
          </button>
        </>
      ) : (
        <>
          <span className="muted" style={{ fontSize: 11 }}>
            {status === 'not-installed' ? 'Fluent not installed' : 'not connected'}
          </span>
          {canConnect && (
            <button
              type="button"
              className="primary"
              style={{ padding: '3px 10px', fontSize: 11 }}
              disabled={isPending}
              onClick={doConnect}
            >
              {isPending ? '…' : 'Connect'}
            </button>
          )}
          {connectErr && <span style={{ color: 'var(--err)', fontSize: 10 }}>{connectErr}</span>}
        </>
      )}
    </div>
  );
}

// ── Public component ───────────────────────────────────────────────────

export function WalletBar() {
  return (
    <div className="dual-wallet-bar">
      <ESpacePill />
      <span className="dual-wallet-divider" aria-hidden="true">
        |
      </span>
      <CorePill />
    </div>
  );
}
