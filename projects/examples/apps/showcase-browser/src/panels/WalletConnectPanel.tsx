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
import { getFluentProvider, useCoreWallet } from '../lib/use-core-wallet.js';
import { UseWalletCard, WagmiCard } from './wallet-connect-cards.js';

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
    const timer = setInterval(check, 2_000);
    return () => clearInterval(timer);
  }, []);

  const coreChainDisplay =
    coreChainId === '0x405'
      ? 'Core Mainnet (1029)'
      : coreChainId === '0x1'
        ? 'Core Testnet (1)'
        : (coreChainId ?? 'unknown');
  const softDisconnect = (store: {
    setState: (state: { account: undefined; status: 'not-active' }) => void;
  }) => {
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
