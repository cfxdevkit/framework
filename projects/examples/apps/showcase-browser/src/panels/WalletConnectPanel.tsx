/**
 * WalletConnectPanel — unified connection hub for all wallet providers.
 *
 * Replaces five separate connect panels (WagmiConnectPanel,
 * CoreFluentPanel, EspaceFluentPanel, EspaceMetaMaskPanel,
 * RawProvidersPanel) with a single 2×2 grid of provider cards.
 *
 *   ┌──────────────────┬───────────────────┐
 *   │ wagmi / injected │  Fluent Core      │
 *   │  (non-Fluent)    │  window.conflux   │
 *   ├──────────────────┼───────────────────┤
 *   │ Fluent eSpace    │  MetaMask         │
 *   │  window.fluent   │  window.ethereum  │
 *   └──────────────────┴───────────────────┘
 *
 * Cards are disabled (dimmed) when the provider is not installed.
 * Each card has an inline connect/disconnect button.
 */

import { CopyButton, errMsg } from '@cfxdevkit/example-showcase-ui';
import {
  connect as fluentConnect,
  provider as fluentProvider,
  store as fluentStore,
  useAccount as useFluentAccount,
  useChainId as useFluentChainId,
  useStatus as useFluentStatus,
} from '@cfxjs/use-wallet-react/ethereum/Fluent';
import {
  connect as mmConnect,
  provider as mmProvider,
  store as mmStore,
  useAccount as useMMAccount,
  useChainId as useMMChainId,
  useStatus as useMMStatus,
} from '@cfxjs/use-wallet-react/ethereum/MetaMask';
import { useEffect, useState } from 'react';
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { getFluentProvider, useCoreWallet } from '../lib/use-core-wallet.js';

// ── Helpers ────────────────────────────────────────────────────────────

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

// ── wagmi / injected card ─────────────────────────────────────────────

function WagmiCard() {
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
            {chains.map((c) => (
              <button
                key={c.id}
                type="button"
                className={c.id === chainId ? 'primary' : 'secondary'}
                style={{ padding: '4px 10px', fontSize: 11 }}
                disabled={switching || c.id === chainId}
                onClick={() => switchChain({ chainId: c.id })}
              >
                {c.name}
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
          {connectors.map((c) => (
            <button
              key={c.uid}
              type="button"
              className="primary"
              style={{ padding: '5px 12px', fontSize: 11 }}
              disabled={isPending}
              onClick={() => connect({ connector: c })}
            >
              {c.name}
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

// ── Generic use-wallet-react card ─────────────────────────────────────

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

function UseWalletCard({
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

  const displayChain = chainDisplay ?? chainId ?? 'unknown';

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

// ── Main panel ─────────────────────────────────────────────────────────

export function WalletConnectPanel() {
  const {
    status: coreStatus,
    address: coreAccount,
    chainId: coreChainId,
    connect: coreConnect,
    disconnect: coreDisconnect,
  } = useCoreWallet();

  const fluentStatus = useFluentStatus();
  const fluentAccount = useFluentAccount();
  const fluentChainId = useFluentChainId();

  const mmStatus = useMMStatus();
  const mmAccount = useMMAccount();
  const mmChainId = useMMChainId();

  // Poll window provider presence every 2 s (providers inject asynchronously).
  const [win, setWin] = useState({
    conflux: Boolean(getFluentProvider()),
    fluent: Boolean(fluentProvider),
    ethereum: Boolean(mmProvider),
  });

  useEffect(() => {
    const check = () => {
      setWin({
        conflux: Boolean(getFluentProvider()),
        fluent: Boolean(fluentProvider),
        ethereum: Boolean(mmProvider),
      });
    };
    check();
    const t = setInterval(check, 2_000);
    return () => clearInterval(t);
  }, []);

  const coreChainDisplay =
    coreChainId === '0x405'
      ? 'Core Mainnet (1029)'
      : coreChainId === '0x1'
        ? 'Core Testnet (1)'
        : (coreChainId ?? 'unknown');

  // Soft-disconnect helpers — use-wallet-react has no native disconnect API.
  // We reset each provider's zustand store directly so their hooks reflect
  // the disconnected state immediately.
  const softDisconnect = (
    // biome-ignore lint/suspicious/noExplicitAny: internal store shape
    store: { setState: (s: any) => void },
  ) => {
    try {
      store.setState({ account: undefined, status: 'not-active' });
    } catch {
      // ignore
    }
  };

  return (
    <section className="panel">
      <h2>Wallet providers</h2>
      <p className="panel-desc">
        Conflux has two parallel spaces. Connect them independently — each requires its own wallet
        approval. <strong>wagmi</strong> covers eSpace EVM interactions;{' '}
        <strong>Fluent Core</strong> covers Core-space <code className="mono">cfx_*</code> RPC.
        Cards dim when the extension is not detected.
      </p>

      <h3 style={{ fontSize: 13, marginBottom: 8 }}>eSpace / EVM</h3>
      <div className="provider-grid">
        <WagmiCard />

        <UseWalletCard
          title="Fluent eSpace"
          space="espace"
          status={fluentStatus}
          account={fluentAccount}
          chainId={fluentChainId}
          providerPresent={win.fluent}
          providerDesc="window.fluent — Fluent's dedicated eSpace provider, separate from window.ethereum. Coexists with MetaMask on the same page."
          onConnect={async () => {
            await fluentConnect();
          }}
          onDisconnect={() => softDisconnect(fluentStore)}
        />

        <UseWalletCard
          title="MetaMask"
          space="espace"
          status={mmStatus}
          account={mmAccount}
          chainId={mmChainId}
          providerPresent={win.ethereum}
          providerDesc="window.ethereum with isMetaMask=true. Same EIP-1193 surface that wagmi uses; this card exposes the raw use-wallet-react status lifecycle."
          onConnect={async () => {
            await mmConnect();
          }}
          onDisconnect={() => softDisconnect(mmStore)}
        />
      </div>

      <h3 style={{ fontSize: 13, marginTop: 20, marginBottom: 8 }}>Conflux Core</h3>
      <div className="provider-grid">
        <UseWalletCard
          title="Fluent Core"
          space="core"
          status={coreStatus}
          account={coreAccount}
          chainId={coreChainId}
          providerPresent={win.conflux}
          chainDisplay={coreChainDisplay}
          providerDesc="window.conflux — Fluent's Core-space provider. Speaks cfx_* RPC, returns base32 CIP-37 addresses (cfx:aa…)."
          onConnect={async () => {
            await coreConnect();
          }}
          onDisconnect={() => coreDisconnect()}
        />
      </div>
    </section>
  );
}
