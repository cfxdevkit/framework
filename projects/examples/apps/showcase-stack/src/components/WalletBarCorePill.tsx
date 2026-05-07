import { formatCFX } from '@cfxdevkit/core';
import {
  CopyButton,
  type CoreChainConfig,
  coreChainLabel,
  deriveCoreState,
  errMsg,
  getFluentCoreProvider,
  useCoreWallet,
} from '@cfxdevkit/example-showcase-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toHex } from 'viem';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { shortBase32 } from './wallet-format.js';

export function CorePill() {
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

  const targetChainHex = toHex(network.core.id);
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
