import { CopyButton, errMsg } from '@cfxdevkit/example-showcase-ui';
import { useState } from 'react';
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from 'wagmi';

function StatusBadge({ status }: { status: string | undefined }) {
  const colour =
    status === 'active'
      ? '#80ed99'
      : status === 'not-installed'
        ? '#f85149'
        : status === 'not-active'
          ? '#8a93a3'
          : '#ffb703';
  return (
    <span
      className="mono"
      style={{
        fontSize: 10,
        padding: '1px 6px',
        borderRadius: 4,
        background: `${colour}22`,
        color: colour,
      }}
    >
      {status ?? 'detecting…'}
    </span>
  );
}

export function WagmiCard() {
  const { address, isConnected, status, connector } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { chains, switchChain, isPending: switching } = useSwitchChain();
  const statusStr: string = isConnected
    ? 'active'
    : status === 'connecting' || isPending
      ? 'in-activating'
      : 'not-active';
  const chainLabel =
    chainId === 1030
      ? 'eSpace Mainnet (1030)'
      : chainId === 71
        ? 'eSpace Testnet (71)'
        : `chain ${chainId}`;

  return (
    <div className={`provider-card${isConnected ? ' card-active' : ''}`}>
      <div className="provider-card-title">
        <span className="space-badge space-espace">eSpace</span>
        wagmi · injected
        <StatusBadge status={statusStr} />
      </div>
      <p className="provider-card-desc">
        EIP-1193 standard. Connects to a non-Fluent wallet on{' '}
        <code className="mono">window.ethereum</code> — MetaMask, Rabby, OKX, Brave, Frame…
      </p>
      {isConnected && address ? (
        <>
          <div className="provider-card-info">
            {address} <CopyButton text={address} />
            {'\n'}chain: {chainLabel}
            {'\n'}via: {connector?.name ?? 'unknown'}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {chains.map((chain) => (
              <button
                key={chain.id}
                type="button"
                className={chain.id === chainId ? 'primary' : 'secondary'}
                style={{ padding: '4px 10px', fontSize: 11 }}
                disabled={switching || chain.id === chainId}
                onClick={() => switchChain({ chainId: chain.id })}
              >
                {chain.name}
              </button>
            ))}
            <button
              type="button"
              className="secondary"
              style={{ padding: '4px 10px', fontSize: 11 }}
              onClick={() => disconnect()}
            >
              Disconnect
            </button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              type="button"
              className="primary"
              style={{ padding: '5px 12px', fontSize: 11 }}
              disabled={isPending}
              onClick={() => connect({ connector })}
            >
              {connector.name}
            </button>
          ))}
        </div>
      )}
      {error && (
        <div style={{ color: 'var(--err)', fontSize: 11, marginTop: 4 }}>{error.message}</div>
      )}
    </div>
  );
}

interface UseWalletCardProps {
  title: string;
  space: 'core' | 'espace';
  status: string | undefined;
  account: string | null | undefined;
  chainId: string | null | undefined;
  providerPresent: boolean;
  providerDesc: string;
  chainDisplay?: string;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
}

export function UseWalletCard({
  title,
  space,
  status,
  account,
  chainId,
  providerPresent,
  providerDesc,
  chainDisplay,
  onConnect,
  onDisconnect,
}: UseWalletCardProps) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isActive = status === 'active';
  const notInstalled = status === 'not-installed';
  const isPending =
    busy ||
    status === 'in-detecting' ||
    status === 'in-activating' ||
    status === 'detecting' ||
    status === 'connecting';
  const displayChain = chainDisplay ?? chainId ?? 'unknown';

  const doConnect = async () => {
    if (status !== 'not-active') return;
    setErr(null);
    setBusy(true);
    try {
      await onConnect();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`provider-card${isActive ? ' card-active' : ''}${notInstalled ? ' card-not-installed' : ''}`}
    >
      <div className="provider-card-title">
        <span className={`space-badge space-${space}`}>{space === 'core' ? 'Core' : 'eSpace'}</span>
        {title}
        <StatusBadge status={status} />
      </div>
      <p className="provider-card-desc">{providerDesc}</p>
      <div className="provider-card-info">
        window provider: {providerPresent ? '✓ present' : '✗ absent'}
      </div>
      {isActive && account ? (
        <div className="provider-card-info">
          {account}
          {'\n'}chain: {displayChain}
        </div>
      ) : null}
      {isActive && (
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <button
            type="button"
            className="secondary"
            style={{ padding: '4px 10px', fontSize: 11 }}
            onClick={onDisconnect}
          >
            Disconnect
          </button>
        </div>
      )}
      {!isActive && !notInstalled && (
        <>
          <button
            type="button"
            className="primary"
            style={{ padding: '5px 12px', fontSize: 11 }}
            disabled={isPending}
            onClick={() => void doConnect()}
          >
            {isPending ? 'Connecting…' : `Connect ${title}`}
          </button>
          {err && <div style={{ color: 'var(--err)', fontSize: 11 }}>{err}</div>}
        </>
      )}
      {notInstalled && (
        <div style={{ color: 'var(--err)', fontSize: 11 }}>
          Extension not detected in this browser.
        </div>
      )}
    </div>
  );
}
