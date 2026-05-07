/**
 * DualWalletBar — persistent header indicator showing both wallet spaces.
 *
 * Replaces the single wagmi WalletPill with two side-by-side pills:
 *
 *   eSpace pill  — wagmi account (non-Fluent injected EIP-1193)
 *   Core pill    — direct window.conflux connector
 *
 * Each pill shows: status, balance, short address, network label and a
 * connect/disconnect button. Users can connect either space independently.
 *
 * Wallets on an unrecognised chain show an amber "⚠ wrong network" badge
 * so the user knows the connection is not usable for this dApp.
 */
import { CopyButton, WalletPickerModal } from '@cfxdevkit/example-showcase-ui';
import { useState } from 'react';
import { formatUnits } from 'viem';
import {
  useAccount,
  useBalance,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from 'wagmi';
import { useNetwork } from '../contexts/NetworkContext.js';
import { CORE_CHAIN_CONFIGS, useCoreWallet } from '../lib/use-core-wallet.js';

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function shortBase32(addr: string): string {
  const colon = addr.indexOf(':');
  if (colon !== -1) {
    return `${addr.slice(0, colon + 1)}…${addr.slice(-6)}`;
  }
  return `${addr.slice(0, 8)}…${addr.slice(-4)}`;
}

// ── eSpace pill (wagmi) ────────────────────────────────────────────────

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

  const onCorrectChain = !isConnected || chainId === network.espaceChainId;
  const chainLabel =
    chainId === 1030 ? 'eSpace' : chainId === 71 ? 'eSpace Testnet' : `chain ${chainId}`;

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
              ? `${Number(formatUnits(balance.value, balance.decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${balance.symbol}`
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
              onClick={() => switchChain({ chainId: network.espaceChainId }, { onError: () => {} })}
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
      <WalletPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}

// ── Core pill (useCoreWallet — no @cfxjs/use-wallet-react) ────────────────

function CorePill() {
  const {
    status,
    address: account,
    chainId,
    isConnected,
    isConnecting,
    error: connectErr,
    connect,
    switchChain,
    disconnect,
  } = useCoreWallet();
  const { network } = useNetwork();

  const notInstalled = status === 'not-installed';
  const isPending = status === 'detecting' || isConnecting;

  const onCorrectChain =
    !isConnected || chainId?.toLowerCase() === network.coreChainIdHex.toLowerCase();

  const chainLabel =
    chainId === '0x405' ? 'Core' : chainId === '0x1' ? 'Core Testnet' : `chain ${chainId ?? '?'}`;

  const doSwitchChain = () => {
    const config = CORE_CHAIN_CONFIGS[network.coreChainIdDecimal];
    if (config) void switchChain(config);
  };

  const pillClass = `wallet-pill${isConnected ? (onCorrectChain ? ' pill-active' : ' pill-warn') : ''}`;

  return (
    <div className={pillClass}>
      <span className="space-badge space-core" style={{ fontSize: 10, flexShrink: 0 }}>
        Core
      </span>
      {isConnected && account ? (
        <>
          {!onCorrectChain && (
            <span style={{ color: 'var(--warn, #ffb703)', fontSize: 10, fontWeight: 600 }}>
              ⚠ wrong network
            </span>
          )}
          <span className="mono wallet-addr" title={account}>
            {shortBase32(account)}
          </span>
          <CopyButton text={account} />
          <span className="muted" style={{ fontSize: 10 }}>
            Fluent · {chainLabel}
          </span>
          {!onCorrectChain && (
            <button
              type="button"
              className="primary"
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
            onClick={() => disconnect()}
          >
            ✕
          </button>
        </>
      ) : (
        <>
          <span className="muted" style={{ fontSize: 11 }}>
            {notInstalled ? 'Fluent not installed' : 'not connected'}
          </span>
          {!notInstalled && (
            <button
              type="button"
              className="primary"
              style={{ padding: '3px 10px', fontSize: 11 }}
              disabled={isPending}
              onClick={() => void connect()}
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

export function DualWalletBar() {
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
