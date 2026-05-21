'use client';

import type { Signer } from '@cfxdevkit/cdk/wallet';
import { signerFromPrivateKey } from '@cfxdevkit/cdk/wallet';
import { DemoCard, StatusBadge } from '@cfxdevkit/example-showcase-ui';
import {
  createLedgerHardwareAdapter,
  type LedgerTransportLike,
} from '@cfxdevkit/wallet/hardware/ledger';
import { useEffect, useState } from 'react';
import { generatePrivateKey } from 'viem/accounts';
import { readBalances } from './balance-context';
import { WalletSummary } from './wallet-summary';

const CORE_NETWORK_ID = 1;
const ESPACE_CHAIN_ID = 71;
const EVM_LEDGER_PATH = "m/44'/60'/0'/0/0";
const CORE_LEDGER_PATH = "m/44'/503'/0'/0/0";

const BUTTON_STYLE: React.CSSProperties = {
  padding: 'var(--cfx-space-2) var(--cfx-space-4)',
  background: 'var(--cfx-color-brand-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--cfx-radius-md)',
  cursor: 'pointer',
  fontSize: 'var(--cfx-text-sm)',
};
const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: 'var(--cfx-space-2) var(--cfx-space-3)',
  background: 'var(--cfx-color-bg-emphasis)',
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-md)',
  color: 'var(--cfx-color-fg-default)',
  fontSize: 'var(--cfx-text-sm)',
  boxSizing: 'border-box',
};
const GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 'var(--cfx-space-4)',
};
const PANEL_STYLE: React.CSSProperties = {
  display: 'grid',
  gap: 'var(--cfx-space-3)',
  padding: 'var(--cfx-space-4)',
  background: 'var(--cfx-color-bg-subtle)',
  border: '1px solid var(--cfx-color-border-subtle)',
  borderRadius: 'var(--cfx-radius-md)',
};
const MUTED_STYLE: React.CSSProperties = {
  color: 'var(--cfx-color-fg-muted)',
  fontSize: 'var(--cfx-text-sm)',
  margin: 0,
};

interface DemoWallet {
  eSpace: `0x${string}`;
  core: string;
  signature: `0x${string}` | '';
  balances: { eSpace: string; core: string };
}

interface LedgerWallet extends DemoWallet {
  eSpaceSigner: Signer;
  coreSigner: Signer;
  transport: LedgerTransportLike;
}

export function HardwareWalletSection() {
  return (
    <DemoCard
      title="Hardware Wallets"
      description="Browser memory wallet and Ledger demos for the same eSpace/Core address, balance, and message-signing surface."
    >
      <div style={GRID_STYLE}>
        <MemoryWalletPanel />
        <LedgerWalletPanel />
      </div>
    </DemoCard>
  );
}

function MemoryWalletPanel() {
  const [message, setMessage] = useState('Hello from showcase-public memory wallet');
  const [wallet, setWallet] = useState<DemoWallet | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function generateWallet() {
    setBusy(true);
    setError('');
    setWallet(null);
    try {
      const privateKey = generatePrivateKey();
      const signer = signerFromPrivateKey(privateKey, CORE_NETWORK_ID);
      if (!signer.account.coreAddress) throw new Error('Core address derivation failed.');
      const [signature, balances] = await Promise.all([
        signer.signMessage(message),
        readBalances(signer.account.address, signer.account.coreAddress),
      ]);
      setWallet({
        eSpace: signer.account.address,
        core: signer.account.coreAddress,
        signature,
        balances,
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={PANEL_STYLE}>
      <StatusBadge
        status={wallet ? 'ok' : 'pending'}
        label={wallet ? 'Memory wallet ready' : 'Generated in browser memory'}
      />
      <label style={labelStyle}>
        Demo message
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          style={INPUT_STYLE}
        />
      </label>
      <button
        type="button"
        onClick={() => void generateWallet()}
        disabled={busy}
        style={{ ...BUTTON_STYLE, cursor: busy ? 'not-allowed' : 'pointer' }}
      >
        {busy ? 'Generating...' : 'Generate and Sign'}
      </button>
      {error && <StatusBadge status="error" label={error} />}
      {wallet && <WalletSummary wallet={wallet} />}
    </section>
  );
}

function LedgerWalletPanel() {
  const [webHidSupported, setWebHidSupported] = useState<boolean | null>(null);
  const [message, setMessage] = useState('Hello from showcase-public Ledger');
  const [wallet, setWallet] = useState<LedgerWallet | null>(null);
  const [signature, setSignature] = useState<`0x${string}` | ''>('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setWebHidSupported(typeof navigator !== 'undefined' && 'hid' in navigator);
  }, []);

  useEffect(() => {
    return () => {
      void wallet?.transport.close?.();
    };
  }, [wallet]);

  async function connectLedger() {
    setBusy(true);
    setError('');
    setSignature('');
    try {
      if (!webHidSupported) throw new Error('WebHID is not available in this browser.');
      await wallet?.transport.close?.();
      const [{ default: TransportWebHID }, { default: Eth }] = await Promise.all([
        import('@ledgerhq/hw-transport-webhid'),
        import('@ledgerhq/hw-app-eth'),
      ]);
      const transport = (await TransportWebHID.create()) as LedgerTransportLike;
      const eth = new Eth(transport as never);
      const eSpaceSigner = await createLedgerHardwareAdapter({
        eth,
        family: 'espace',
        path: EVM_LEDGER_PATH,
        chainId: ESPACE_CHAIN_ID,
        showAddressOnDevice: true,
      }).getSigner();
      const coreSigner = await createLedgerHardwareAdapter({
        coreTransport: transport,
        family: 'core',
        path: CORE_LEDGER_PATH,
        chainId: CORE_NETWORK_ID,
        coreNetworkId: CORE_NETWORK_ID,
        showAddressOnDevice: false,
      }).getSigner();
      const coreAddress = coreSigner.account.coreAddress;
      if (!coreAddress) throw new Error('Ledger Core address derivation failed.');
      const balances = await readBalances(eSpaceSigner.account.address, coreAddress);
      setWallet({
        eSpace: eSpaceSigner.account.address,
        core: coreAddress,
        signature: '',
        balances,
        eSpaceSigner,
        coreSigner,
        transport,
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function signLedgerMessage() {
    if (!wallet) return;
    setBusy(true);
    setError('');
    try {
      const nextSignature = await wallet.eSpaceSigner.signMessage(message);
      setSignature(nextSignature);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={PANEL_STYLE}>
      <StatusBadge
        status={webHidSupported ? (wallet ? 'ok' : 'pending') : 'error'}
        label={
          webHidSupported === null
            ? 'Checking WebHID'
            : webHidSupported
              ? wallet
                ? 'Ledger connected'
                : 'WebHID ready'
              : 'WebHID unavailable'
        }
      />
      <p style={MUTED_STYLE}>
        Paths: eSpace {EVM_LEDGER_PATH}, Core {CORE_LEDGER_PATH}
      </p>
      <button
        type="button"
        onClick={() => void connectLedger()}
        disabled={!webHidSupported || busy}
        style={{ ...BUTTON_STYLE, cursor: !webHidSupported || busy ? 'not-allowed' : 'pointer' }}
      >
        {busy ? 'Waiting for device...' : wallet ? 'Reconnect Ledger' : 'Connect Ledger'}
      </button>
      <label style={labelStyle}>
        Demo message
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          style={INPUT_STYLE}
        />
      </label>
      <button
        type="button"
        onClick={() => void signLedgerMessage()}
        disabled={!wallet || busy}
        style={{ ...BUTTON_STYLE, cursor: !wallet || busy ? 'not-allowed' : 'pointer' }}
      >
        {busy ? 'Waiting for device...' : 'Sign Message'}
      </button>
      {error && <StatusBadge status="error" label={error} />}
      {wallet && <WalletSummary wallet={{ ...wallet, signature }} />}
    </section>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 'var(--cfx-space-1)',
  color: 'var(--cfx-color-fg-subtle)',
  fontSize: 'var(--cfx-text-sm)',
};
