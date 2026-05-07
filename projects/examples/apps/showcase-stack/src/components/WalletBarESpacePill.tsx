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
import { useNetwork } from '../contexts/NetworkProvider.js';
import { shortAddr } from './wallet-format.js';

export function ESpacePill() {
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
