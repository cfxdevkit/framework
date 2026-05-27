'use client';

import type { Signer } from '@cfxdevkit/cdk/wallet';
import { CodeSnippet } from '@cfxdevkit/example-showcase-ui';
import { BUTTON_STYLE, MUTED_STYLE } from './panel-styles';

interface SigningDemoProps {
  eSpaceSigner: Signer;
  coreSigner: Signer;
  message: string;
  onMessage: (m: string) => void;
  sigs: { eSpaceMsg: string; eSpaceTyped: string; coreMsg: string; coreTyped: string };
  onSign: (op: 'eSpaceMsg' | 'eSpaceTyped' | 'coreMsg' | 'coreTyped') => void;
  busy: string;
}

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

export function OneKeySigningDemo({
  eSpaceSigner: _e,
  coreSigner: _c,
  message,
  onMessage,
  sigs,
  onSign,
  busy,
}: SigningDemoProps) {
  const ops = [
    { key: 'eSpaceMsg', label: 'eSpace signMessage' },
    { key: 'eSpaceTyped', label: '✅ eSpace EIP-712' },
    { key: 'coreMsg', label: 'Core signMessage' },
    { key: 'coreTyped', label: '✅ Core CIP-23 · hash-sign' },
  ] as const;

  return (
    <div style={{ display: 'grid', gap: 'var(--cfx-space-3)' }}>
      <label
        style={{
          display: 'grid',
          gap: 'var(--cfx-space-1)',
          color: 'var(--cfx-color-fg-subtle)',
          fontSize: 'var(--cfx-text-sm)',
        }}
      >
        Message to sign
        <input value={message} onChange={(e) => onMessage(e.target.value)} style={INPUT_STYLE} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--cfx-space-2)' }}>
        {ops.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSign(key)}
            disabled={busy !== ''}
            style={{
              ...BUTTON_STYLE,
              cursor: busy !== '' ? 'not-allowed' : 'pointer',
              fontSize: 'var(--cfx-text-xs)',
            }}
          >
            {busy === key ? 'Waiting...' : label}
          </button>
        ))}
      </div>
      <p style={MUTED_STYLE}>
        Core CIP-23 currently uses hash-based signing in OneKey SDK. Device firmware may show an
        "unable to decode data" warning while still producing a valid signature.
      </p>
      {sigs.eSpaceMsg && <CodeSnippet code={sigs.eSpaceMsg} label="eSpace message signature" />}
      {sigs.eSpaceTyped && (
        <CodeSnippet code={sigs.eSpaceTyped} label="eSpace EIP-712 signature (exclusive)" />
      )}
      {sigs.coreMsg && <CodeSnippet code={sigs.coreMsg} label="Core message signature" />}
      {sigs.coreTyped && (
        <CodeSnippet code={sigs.coreTyped} label="Core CIP-23 signature (exclusive)" />
      )}
    </div>
  );
}

export function OneKeyReferralCard() {
  const referralUrl = process.env.NEXT_PUBLIC_ONEKEY_REFERRAL_URL ?? 'https://onekey.so';
  const discountCode = process.env.NEXT_PUBLIC_ONEKEY_DISCOUNT_CODE;

  return (
    <div
      style={{
        padding: 'var(--cfx-space-4)',
        background:
          'color-mix(in srgb, var(--cfx-color-brand-primary) 6%, var(--cfx-color-bg-subtle))',
        border: '1px solid color-mix(in srgb, var(--cfx-color-brand-primary) 20%, transparent)',
        borderRadius: 'var(--cfx-radius-md)',
        display: 'grid',
        gap: 'var(--cfx-space-3)',
      }}
    >
      <div>
        <p
          style={{
            fontWeight: 700,
            fontSize: 'var(--cfx-text-base)',
            margin: '0 0 4px',
            color: 'var(--cfx-color-fg-default)',
          }}
        >
          🔑 OneKey Classic S1
        </p>
        <p style={{ ...MUTED_STYLE, marginBottom: 0 }}>
          EAL 6+ certified · USB-C · 30 000+ coins · Full Conflux Core + eSpace with EIP-712 and
          CIP-23 signed-data support.
        </p>
      </div>
      {discountCode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cfx-space-2)' }}>
          <span style={MUTED_STYLE}>Discount code:</span>
          <code
            style={{
              padding: '2px 8px',
              background: 'var(--cfx-color-bg-emphasis)',
              borderRadius: 'var(--cfx-radius-sm)',
              fontWeight: 700,
              fontSize: 'var(--cfx-text-sm)',
              border: '1px solid var(--cfx-color-border-default)',
            }}
          >
            {discountCode}
          </code>
        </div>
      )}
      <a
        href={referralUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          ...BUTTON_STYLE,
          display: 'inline-block',
          textDecoration: 'none',
          textAlign: 'center',
        }}
      >
        Get OneKey Classic S1 →
      </a>
    </div>
  );
}
