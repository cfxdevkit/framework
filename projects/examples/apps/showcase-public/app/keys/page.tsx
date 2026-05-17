'use client';

import { deriveDualAccount, generateMnemonic, validateMnemonic } from '@cfxdevkit/core';
import { CodeSnippet, DemoCard, StatusBadge } from '@cfxdevkit/example-showcase-ui';
import { useState } from 'react';
import { SiteLayout } from '../site-layout';
import { HardwareWalletSection } from './hardware-wallet-section';

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

interface DerivedPair {
  eSpace: string;
  core: string;
}

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function KeysPage() {
  const [mnemonic, setMnemonic] = useState('');
  const [validateInput, setValidateInput] = useState('');
  const [deriveInput, setDeriveInput] = useState('');
  const [derived, setDerived] = useState<DerivedPair | null>(null);
  const [deriveError, setDeriveError] = useState('');

  const isValid = validateInput.trim() ? validateMnemonic(validateInput.trim()) : null;

  function handleGenerate() {
    setMnemonic(generateMnemonic());
  }

  function handleDerive() {
    setDeriveError('');
    setDerived(null);
    const m = deriveInput.trim();
    if (!m) return;
    try {
      const account = deriveDualAccount({ mnemonic: m, index: 0 });
      setDerived({ eSpace: account.evmAddress, core: account.coreAddress });
    } catch (e) {
      setDeriveError(String(e));
    }
  }

  return (
    <SiteLayout>
      {/* Generate */}
      <DemoCard
        title="Generate Mnemonic"
        description="generateMnemonic() — BIP39 12-word phrase, runs entirely in the browser."
      >
        <button
          type="button"
          onClick={handleGenerate}
          style={{ ...BUTTON_STYLE, marginBottom: mnemonic ? 'var(--cfx-space-3)' : 0 }}
        >
          Generate Mnemonic
        </button>
        {mnemonic && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 'var(--cfx-space-2)',
                marginBottom: 'var(--cfx-space-3)',
              }}
            >
              {mnemonic.split(' ').map((word, i) => (
                <div
                  key={word}
                  style={{
                    padding: 'var(--cfx-space-2)',
                    background: 'var(--cfx-color-bg-emphasis)',
                    border: '1px solid var(--cfx-color-border-default)',
                    borderRadius: 'var(--cfx-radius-sm)',
                    fontSize: 'var(--cfx-text-sm)',
                    display: 'flex',
                    gap: 'var(--cfx-space-2)',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      color: 'var(--cfx-color-fg-muted)',
                      width: 20,
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}.
                  </span>
                  <span style={{ fontFamily: 'monospace' }}>{word}</span>
                </div>
              ))}
            </div>
            <CodeSnippet code={mnemonic} label="Full phrase (copy & store safely)" />
          </div>
        )}
      </DemoCard>

      {/* Validate */}
      <DemoCard
        title="Validate Mnemonic"
        description="validateMnemonic() — checks BIP39 word list and checksum."
      >
        <textarea
          value={validateInput}
          onChange={(e) => setValidateInput(e.target.value)}
          placeholder="Enter 12 or 24 words separated by spaces…"
          rows={3}
          style={{ ...INPUT_STYLE, resize: 'vertical', marginBottom: 'var(--cfx-space-2)' }}
        />
        {isValid !== null && (
          <StatusBadge
            status={isValid ? 'ok' : 'error'}
            label={isValid ? 'Valid BIP39 mnemonic' : 'Invalid mnemonic'}
          />
        )}
      </DemoCard>

      {/* Derive */}
      <DemoCard
        title="Derive Accounts"
        description="deriveDualAccounts(mnemonic, index) — returns eSpace and Core addresses for account index 0."
      >
        <textarea
          value={deriveInput}
          onChange={(e) => setDeriveInput(e.target.value)}
          placeholder="Paste a mnemonic to derive addresses…"
          rows={3}
          style={{ ...INPUT_STYLE, resize: 'vertical', marginBottom: 'var(--cfx-space-2)' }}
        />
        <button type="button" onClick={handleDerive} style={BUTTON_STYLE}>
          Derive Accounts
        </button>
        {deriveError && (
          <p
            style={{
              color: 'var(--cfx-color-feedback-danger)',
              fontSize: 'var(--cfx-text-sm)',
              marginTop: 'var(--cfx-space-2)',
            }}
          >
            {deriveError}
          </p>
        )}
        {derived && (
          <div
            style={{
              marginTop: 'var(--cfx-space-3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--cfx-space-3)',
            }}
          >
            <CodeSnippet code={derived.eSpace} label="eSpace address (index 0)" />
            <CodeSnippet code={derived.core} label="Core address (index 0)" />
          </div>
        )}
      </DemoCard>

      <HardwareWalletSection />
    </SiteLayout>
  );
}
