'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SiteLayout } from '../../site-layout';
import {
  type DemoSigner,
  OPTIONS,
  PANEL_ACTIVE_STYLE,
  PANEL_STYLE,
  type SignerKind,
  SignerOptionCard,
  STORAGE_KEY,
} from './signer-options';

const BTN_PRIMARY: React.CSSProperties = {
  padding: 'var(--cfx-space-2) var(--cfx-space-4)',
  background: 'var(--cfx-color-brand-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--cfx-radius-md)',
  cursor: 'pointer',
  fontSize: 'var(--cfx-text-sm)',
};
const BTN_SECONDARY: React.CSSProperties = {
  ...BTN_PRIMARY,
  background: 'var(--cfx-color-bg-emphasis)',
  color: 'var(--cfx-color-fg-default)',
  border: '1px solid var(--cfx-color-border-default)',
};
const BACK_LINK: React.CSSProperties = {
  fontSize: 'var(--cfx-text-sm)',
  color: 'var(--cfx-color-fg-muted)',
  textDecoration: 'none',
  display: 'inline-block',
  marginBottom: 'var(--cfx-space-4)',
};
const MUTED: React.CSSProperties = {
  color: 'var(--cfx-color-fg-muted)',
  fontSize: 'var(--cfx-text-sm)',
  margin: 0,
};

// biome-ignore lint/style/noDefaultExport: Next.js page.
export default function SignerSetupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [chosen, setChosen] = useState<SignerKind | null>(null);
  const [saved, setSaved] = useState<DemoSigner | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw) as DemoSigner);
    } catch {
      /* ignore */
    }
  }, []);

  function select(kind: SignerKind) {
    setChosen(kind);
    setStep(2);
  }

  function confirm() {
    if (!chosen) return;
    const opt = OPTIONS.find((o) => o.kind === chosen)!;
    const entry: DemoSigner = { kind: chosen, label: opt.title };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    setSaved(entry);
    setStep(3);
  }

  return (
    <SiteLayout>
      <Link href="/keys" style={BACK_LINK}>
        ← Keys &amp; Signers
      </Link>
      <div style={{ maxWidth: 680, display: 'grid', gap: 'var(--cfx-space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--cfx-text-xl)', fontWeight: 700, margin: '0 0 6px' }}>
            Configure Demo Signer
          </h1>
          <p style={MUTED}>Choose how you want to sign in the demo pages. Saved in your browser.</p>
          {saved && (
            <p style={{ ...MUTED, marginTop: 6, fontSize: 'var(--cfx-text-xs)' }}>
              Current: <strong>{saved.label}</strong>
            </p>
          )}
        </div>

        {step === 1 && (
          <div style={{ display: 'grid', gap: 'var(--cfx-space-3)' }}>
            <p style={{ fontWeight: 600, fontSize: 'var(--cfx-text-sm)', margin: 0 }}>
              Step 1 — Choose a signer:
            </p>
            {OPTIONS.map((opt) => (
              <SignerOptionCard
                key={opt.kind}
                opt={opt}
                active={chosen === opt.kind}
                onSelect={() => select(opt.kind)}
              />
            ))}
          </div>
        )}

        {step === 2 &&
          chosen &&
          (() => {
            const opt = OPTIONS.find((o) => o.kind === chosen)!;
            return (
              <div style={{ display: 'grid', gap: 'var(--cfx-space-4)' }}>
                <p style={{ fontWeight: 600, fontSize: 'var(--cfx-text-sm)', margin: 0 }}>
                  Step 2 — Confirm:
                </p>
                <div style={PANEL_ACTIVE_STYLE}>
                  <p style={{ fontWeight: 700, margin: '0 0 4px' }}>{opt.title}</p>
                  <p style={{ ...MUTED, margin: 0 }}>{opt.subtitle}</p>
                </div>
                {chosen === 'memory' && (
                  <p
                    style={{
                      ...MUTED,
                      background: 'color-mix(in srgb, orange 10%, transparent)',
                      padding: 'var(--cfx-space-3)',
                      borderRadius: 'var(--cfx-radius-md)',
                    }}
                  >
                    ⚠ A fresh private key is generated each time you open the memory demo. It is
                    never stored anywhere. Do not use for real assets.
                  </p>
                )}
                {(chosen === 'ledger' || chosen === 'onekey') && (
                  <p style={MUTED}>
                    Connect your device before opening the demo page. The panel will guide you
                    through connection.
                  </p>
                )}
                <div style={{ display: 'flex', gap: 'var(--cfx-space-3)' }}>
                  <button type="button" onClick={() => setStep(1)} style={BTN_SECONDARY}>
                    ← Back
                  </button>
                  <button type="button" onClick={confirm} style={BTN_PRIMARY}>
                    Save &amp; go to demos
                  </button>
                </div>
              </div>
            );
          })()}

        {step === 3 && saved && (
          <div style={{ display: 'grid', gap: 'var(--cfx-space-4)' }}>
            <div style={{ ...PANEL_STYLE, borderColor: 'var(--cfx-color-feedback-success)' }}>
              <p style={{ fontWeight: 700, margin: '0 0 4px' }}>✅ Signer configured!</p>
              <p style={{ ...MUTED, margin: 0 }}>Active: {saved.label}</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--cfx-space-3)', flexWrap: 'wrap' }}>
              <Link
                href={`/keys/${saved.kind}`}
                style={{ ...BTN_PRIMARY, textDecoration: 'none', fontWeight: 500 }}
              >
                Open demo →
              </Link>
              <Link href="/keys" style={{ ...BTN_SECONDARY, textDecoration: 'none' }}>
                ← Overview
              </Link>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
