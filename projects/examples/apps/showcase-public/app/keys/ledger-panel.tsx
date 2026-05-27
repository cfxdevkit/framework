'use client';

import type { Signer } from '@cfxdevkit/cdk/wallet';
import { CodeSnippet, StatusBadge } from '@cfxdevkit/example-showcase-ui';
import {
  createLedgerHardwareAdapter,
  type LedgerTransportLike,
} from '@cfxdevkit/wallet/hardware/ledger';
import { useEffect, useState } from 'react';
import { readBalances } from './balance-context';
import { BUTTON_STYLE, INPUT_STYLE, labelStyle, MUTED_STYLE, PANEL_STYLE } from './panel-styles';
import { WalletSummary } from './wallet-summary';

const CORE_NETWORK_ID = 1;
const ESPACE_CHAIN_ID = 71;
const EVM_PATH = "m/44'/60'/0'/0/0";
const CORE_PATH = "m/44'/503'/0'/0/0";

interface LedgerState {
  eSpace: `0x${string}`;
  core: string;
  eSpaceSigner: Signer;
  coreSigner: Signer;
  transport: LedgerTransportLike;
  balances: { eSpace: string; core: string };
  eSpaceSig: `0x${string}` | '';
  coreSig: `0x${string}` | '';
}

export function LedgerPanel() {
  const [webHidSupported, setWebHidSupported] = useState<boolean | null>(null);
  const [message, setMessage] = useState('Hello from showcase-public Ledger');
  const [state, setState] = useState<LedgerState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setWebHidSupported('hid' in navigator);
  }, []);
  useEffect(
    () => () => {
      void state?.transport.close?.();
    },
    [state],
  );

  async function connect() {
    setBusy(true);
    setError('');
    try {
      await state?.transport.close?.();
      const [{ default: TransportWebHID }, { default: Eth }] = await Promise.all([
        import('@ledgerhq/hw-transport-webhid'),
        import('@ledgerhq/hw-app-eth'),
      ]);
      const transport = (await TransportWebHID.create()) as LedgerTransportLike;
      const eth = new Eth(transport as never);
      const eSpaceSigner = await createLedgerHardwareAdapter({
        eth,
        family: 'espace',
        path: EVM_PATH,
        chainId: ESPACE_CHAIN_ID,
        showAddressOnDevice: true,
      }).getSigner();
      const coreSigner = await createLedgerHardwareAdapter({
        coreTransport: transport,
        family: 'core',
        path: CORE_PATH,
        chainId: CORE_NETWORK_ID,
        coreNetworkId: CORE_NETWORK_ID,
        showAddressOnDevice: false,
      }).getSigner();
      if (!coreSigner.account.coreAddress) throw new Error('Core address derivation failed.');
      const balances = await readBalances(
        eSpaceSigner.account.address,
        coreSigner.account.coreAddress,
      );
      setState({
        eSpace: eSpaceSigner.account.address,
        core: coreSigner.account.coreAddress,
        eSpaceSigner,
        coreSigner,
        transport,
        balances,
        eSpaceSig: '',
        coreSig: '',
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function signESpace() {
    if (!state) return;
    setBusy(true);
    setError('');
    try {
      setState((s) => (s ? { ...s, eSpaceSig: '' } : s));
      const sig = (await state.eSpaceSigner.signMessage(message)) as `0x${string}`;
      setState((s) => (s ? { ...s, eSpaceSig: sig } : s));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function signCore() {
    if (!state) return;
    setBusy(true);
    setError('');
    try {
      setState((s) => (s ? { ...s, coreSig: '' } : s));
      const sig = (await state.coreSigner.signMessage(message)) as `0x${string}`;
      setState((s) => (s ? { ...s, coreSig: sig } : s));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  const available = webHidSupported !== false;
  return (
    <section style={PANEL_STYLE}>
      <StatusBadge
        status={!available ? 'error' : state ? 'ok' : 'pending'}
        label={
          webHidSupported === null
            ? 'Checking WebHID'
            : !available
              ? 'WebHID unavailable'
              : state
                ? 'Ledger connected'
                : 'WebHID ready'
        }
      />
      <p style={MUTED_STYLE}>
        Paths: eSpace {EVM_PATH} · Core {CORE_PATH}
      </p>
      <button
        type="button"
        onClick={() => void connect()}
        disabled={!available || busy}
        style={{ ...BUTTON_STYLE, cursor: !available || busy ? 'not-allowed' : 'pointer' }}
      >
        {busy ? 'Waiting for device...' : state ? 'Reconnect Ledger' : 'Connect Ledger'}
      </button>
      {state && (
        <>
          <WalletSummary
            wallet={{
              eSpace: state.eSpace,
              core: state.core,
              signature: state.eSpaceSig,
              balances: state.balances,
            }}
          />
          <label style={labelStyle}>
            Demo message
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={INPUT_STYLE}
            />
          </label>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--cfx-space-2)' }}
          >
            <button
              type="button"
              onClick={() => void signESpace()}
              disabled={busy}
              style={{ ...BUTTON_STYLE, cursor: busy ? 'not-allowed' : 'pointer' }}
            >
              Sign on eSpace
            </button>
            <button
              type="button"
              onClick={() => void signCore()}
              disabled={busy}
              style={{ ...BUTTON_STYLE, cursor: busy ? 'not-allowed' : 'pointer' }}
            >
              Sign on Core
            </button>
          </div>
          {state.eSpaceSig && <CodeSnippet code={state.eSpaceSig} label="eSpace signature" />}
          {state.coreSig && <CodeSnippet code={state.coreSig} label="Core signature" />}
          <StatusBadge
            status="error"
            label="EIP-712 and CIP-23 typed-data: ❌ not supported on Ledger"
          />
        </>
      )}
      {error && <StatusBadge status="error" label={error} />}
    </section>
  );
}
