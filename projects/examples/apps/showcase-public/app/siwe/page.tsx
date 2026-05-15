'use client';

import type { LogEntry } from '@cfxdevkit/example-showcase-ui';
import {
  CodeSnippet,
  DemoCard,
  LogBox,
  makeEntry,
  StatusBadge,
} from '@cfxdevkit/example-showcase-ui';
import { createSiweMessage } from '@cfxdevkit/wallet-connect/siwe';
import { useState } from 'react';
import { useAccount, useChainId, useSignMessage } from 'wagmi';
import { SiteLayout } from '../site-layout';

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function SiwePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();

  const [nonce, setNonce] = useState('');
  const [nonceLogs, setNonceLogs] = useState<LogEntry[]>([]);

  const [siweMessage, setSiweMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [signLogs, setSignLogs] = useState<LogEntry[]>([]);

  const [verifyLogs, setVerifyLogs] = useState<LogEntry[]>([]);
  const [payload, setPayload] = useState<Record<string, string> | null>(null);

  async function requestNonce() {
    if (!address) return;
    setNonceLogs([]);
    try {
      const res = await fetch(`/api/auth/nonce?address=${address}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      setNonce(json.nonce);
      setNonceLogs([makeEntry(`Nonce: ${json.nonce}`, 'info')]);
    } catch (e) {
      setNonceLogs([makeEntry(String(e), 'error')]);
    }
  }

  async function signMessage() {
    if (!address || !nonce) return;
    setSignLogs([]);
    try {
      const msg = createSiweMessage({
        domain: window.location.host,
        address,
        uri: window.location.href,
        chainId,
        nonce,
        statement: 'Sign in to Conflux Showcase',
      });
      setSiweMessage(msg);
      const sig = await signMessageAsync({ message: msg });
      setSignature(sig);
      setSignLogs([makeEntry('Message signed successfully.', 'info')]);
    } catch (e) {
      setSignLogs([makeEntry(String(e), 'error')]);
    }
  }

  async function verifyMessage() {
    if (!siweMessage || !signature) return;
    setVerifyLogs([]);
    setPayload(null);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: siweMessage, signature }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Verification failed');
      setVerifyLogs([makeEntry('Verification succeeded.', 'info')]);
      setPayload(json.payload);
    } catch (e) {
      setVerifyLogs([makeEntry(String(e), 'error')]);
    }
  }

  if (!isConnected) {
    return (
      <SiteLayout>
        <DemoCard
          title="SIWE — Sign-In with Ethereum"
          description="Connect a wallet to try the full SIWE flow."
        >
          <StatusBadge status="pending" label="Connect a wallet via the header button to begin" />
        </DemoCard>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      {/* Step 1: Nonce */}
      <DemoCard title="1 · Request Nonce" description={`GET /api/auth/nonce?address=${address}`}>
        <button
          type="button"
          onClick={requestNonce}
          style={{
            padding: 'var(--cfx-space-2) var(--cfx-space-4)',
            background: 'var(--cfx-color-brand-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--cfx-radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--cfx-text-sm)',
            marginBottom: 'var(--cfx-space-3)',
          }}
        >
          Request Nonce
        </button>
        <LogBox entries={nonceLogs} empty="Click to request a nonce from /api/auth/nonce." />
      </DemoCard>

      {/* Step 2: Sign */}
      <DemoCard
        title="2 · Sign SIWE Message"
        description="createSiweMessage → wallet sign via signMessage."
      >
        <button
          type="button"
          onClick={signMessage}
          disabled={!nonce}
          style={{
            padding: 'var(--cfx-space-2) var(--cfx-space-4)',
            background: 'var(--cfx-color-brand-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--cfx-radius-md)',
            cursor: nonce ? 'pointer' : 'not-allowed',
            fontSize: 'var(--cfx-text-sm)',
            marginBottom: 'var(--cfx-space-3)',
          }}
        >
          Sign Message
        </button>
        {!nonce && (
          <p
            style={{
              color: 'var(--cfx-color-fg-muted)',
              fontSize: 'var(--cfx-text-sm)',
              marginBottom: 'var(--cfx-space-2)',
            }}
          >
            Request a nonce first.
          </p>
        )}
        <LogBox entries={signLogs} empty="Waiting for step 1…" />
        {signature && (
          <div style={{ marginTop: 'var(--cfx-space-3)' }}>
            <CodeSnippet code={signature} label="Signature" />
          </div>
        )}
      </DemoCard>

      {/* Step 3: Verify */}
      <DemoCard
        title="3 · Verify on Server"
        description="POST /api/auth/verify — consumes the nonce (one-time use)."
      >
        <button
          type="button"
          onClick={verifyMessage}
          disabled={!signature}
          style={{
            padding: 'var(--cfx-space-2) var(--cfx-space-4)',
            background: 'var(--cfx-color-brand-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--cfx-radius-md)',
            cursor: signature ? 'pointer' : 'not-allowed',
            fontSize: 'var(--cfx-text-sm)',
            marginBottom: 'var(--cfx-space-3)',
          }}
        >
          Verify on Server
        </button>
        {!signature && (
          <p
            style={{
              color: 'var(--cfx-color-fg-muted)',
              fontSize: 'var(--cfx-text-sm)',
              marginBottom: 'var(--cfx-space-2)',
            }}
          >
            Sign the message first.
          </p>
        )}
        <LogBox entries={verifyLogs} empty="Waiting for step 2…" />
      </DemoCard>

      {/* Step 4: Result */}
      {payload && (
        <DemoCard
          title="4 · Decoded JWT Payload"
          description="Payload returned by the server — not persisted, demo only."
        >
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cfx-text-sm)' }}
          >
            <tbody>
              {Object.entries(payload).map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid var(--cfx-color-border-subtle)' }}>
                  <td
                    style={{
                      padding: 'var(--cfx-space-2) var(--cfx-space-3)',
                      color: 'var(--cfx-color-fg-subtle)',
                      width: 80,
                    }}
                  >
                    {k}
                  </td>
                  <td
                    style={{
                      padding: 'var(--cfx-space-2) var(--cfx-space-3)',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                    }}
                  >
                    {String(v)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 'var(--cfx-space-3)' }}>
            <StatusBadge status="ok" label="Authenticated — session is demo-only, not persisted" />
          </div>
        </DemoCard>
      )}
    </SiteLayout>
  );
}
