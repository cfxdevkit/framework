/**
 * Header pill showing wagmi connection state. The `connect`/`disconnect`
 * actions go through the `injected()` connector wired in
 * `WagmiProviders`. Balance and chain id come from wagmi hooks against
 * the active chain; network switching is handled globally by
 * `<NetworkSelector>` in the header.
 *
 * For Conflux *Core space* (Fluent's `window.conflux`) the user has to
 * use the dedicated panel — wagmi only speaks `eth_*` RPC.
 */

import { CopyButton, WalletPickerModal } from '@cfxdevkit/example-showcase-ui';
import { useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount, useBalance, useChainId, useConnect, useDisconnect } from 'wagmi';

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletPill() {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address,
    query: { enabled: Boolean(address), refetchInterval: 12_000 },
  });
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!isConnected || !address) {
    return (
      <div className="row" style={{ gap: 8 }}>
        <button
          type="button"
          className="primary"
          disabled={isConnecting}
          onClick={() => setPickerOpen(true)}
        >
          {isConnecting ? 'Connecting…' : 'Choose wallet…'}
        </button>
        {connectError && (
          <span className="muted" style={{ color: 'var(--err)', fontSize: 12 }}>
            {connectError.message}
          </span>
        )}
        <WalletPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
      </div>
    );
  }

  const activeChainLabel =
    chainId === 1030 ? 'eSpace' : chainId === 71 ? 'eSpace Testnet' : `chain ${chainId}`;

  return (
    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
      <span className="mono" style={{ fontSize: 12 }}>
        {balance
          ? `${Number(formatUnits(balance.value, balance.decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${balance.symbol}`
          : '—'}
      </span>
      <span
        className="mono"
        title={address}
        style={{
          padding: '4px 8px',
          border: '1px solid var(--border)',
          borderRadius: 6,
          fontSize: 12,
        }}
      >
        {shortAddress(address)}
      </span>
      <CopyButton text={address} />
      <span className="muted" style={{ fontSize: 11 }}>
        via {connector?.name ?? 'unknown'} · {activeChainLabel}
      </span>
      <button type="button" className="secondary" onClick={() => setPickerOpen(true)}>
        Switch wallet…
      </button>
      <button type="button" className="secondary" onClick={() => disconnect()}>
        Disconnect
      </button>
      <WalletPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}
