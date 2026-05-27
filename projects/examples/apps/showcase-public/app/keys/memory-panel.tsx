'use client';

import type { Signer } from '@cfxdevkit/cdk/wallet';
import { signerFromPrivateKey } from '@cfxdevkit/cdk/wallet';
import { CodeSnippet, StatusBadge } from '@cfxdevkit/example-showcase-ui';
import { useState } from 'react';
import { generatePrivateKey } from 'viem/accounts';
import { readBalances } from './balance-context';
import { BUTTON_STYLE, INPUT_STYLE, labelStyle, MUTED_STYLE, PANEL_STYLE } from './panel-styles';
import { WalletSummary } from './wallet-summary';

const CORE_NETWORK_ID = 1;

const SHOWCASE_TYPED_DATA = {
  domain: { name: 'Conflux Showcase', version: '1', chainId: 71 },
  types: {
    SignIn: [
      { name: 'message', type: 'string' },
      { name: 'nonce', type: 'string' },
    ],
  },
  primaryType: 'SignIn' as const,
  message: { message: 'Sign in to Conflux Showcase', nonce: 'abc123' },
};

interface DemoWallet {
  signer: Signer;
  eSpace: `0x${string}`;
  core: string;
  signature: `0x${string}` | '';
  typedSig: `0x${string}` | '';
  balances: { eSpace: string; core: string };
}

export function MemoryPanel() {
  const [message, setMessage] = useState('Hello from showcase-public');
  const [wallet, setWallet] = useState<DemoWallet | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    setError('');
    setWallet(null);
    try {
      const signer = signerFromPrivateKey(generatePrivateKey(), CORE_NETWORK_ID);
      if (!signer.account.coreAddress) throw new Error('Core address derivation failed.');
      const balances = await readBalances(signer.account.address, signer.account.coreAddress);
      setWallet({
        signer,
        eSpace: signer.account.address,
        core: signer.account.coreAddress,
        signature: '',
        typedSig: '',
        balances,
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function sign() {
    if (!wallet) return;
    setBusy(true);
    setError('');
    try {
      const [signature, typedSig] = await Promise.all([
        wallet.signer.signMessage(message) as Promise<`0x${string}`>,
        wallet.signer.signTypedData(SHOWCASE_TYPED_DATA as never) as Promise<`0x${string}`>,
      ]);
      setWallet((w) => (w ? { ...w, signature, typedSig } : w));
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
      <p style={MUTED_STYLE}>No hardware required · eSpace + Core · EIP-712 support ✅</p>
      <button
        type="button"
        onClick={() => void generate()}
        disabled={busy}
        style={{ ...BUTTON_STYLE, cursor: busy ? 'not-allowed' : 'pointer' }}
      >
        {busy ? 'Generating...' : 'Generate & Sign'}
      </button>
      {wallet && (
        <>
          <label style={labelStyle}>
            Demo message
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={INPUT_STYLE}
            />
          </label>
          <button
            type="button"
            onClick={() => void sign()}
            disabled={busy}
            style={{ ...BUTTON_STYLE, cursor: busy ? 'not-allowed' : 'pointer' }}
          >
            {busy ? 'Signing...' : 'Sign message + EIP-712'}
          </button>
        </>
      )}
      {error && <StatusBadge status="error" label={error} />}
      {wallet && (
        <WalletSummary
          wallet={{
            eSpace: wallet.eSpace,
            core: wallet.core,
            signature: wallet.signature,
            balances: wallet.balances,
          }}
        />
      )}
      {wallet?.typedSig && (
        <div>
          <p style={{ ...MUTED_STYLE, marginBottom: 'var(--cfx-space-1)' }}>
            EIP-712 typed-data signature:
          </p>
          <CodeSnippet code={wallet.typedSig} label="signTypedData result" />
        </div>
      )}
    </section>
  );
}
