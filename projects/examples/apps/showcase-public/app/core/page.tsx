'use client';

import { base32ToHex, hexToBase32 } from '@cfxdevkit/core';
import type { LogEntry } from '@cfxdevkit/example-showcase-ui';
import { CodeSnippet, DemoCard, LogBox, makeEntry } from '@cfxdevkit/example-showcase-ui';
import { useState } from 'react';
import { SiteLayout } from '../site-layout';
import { CHAINS, CLIENT_SNIPPET, CODEC_SNIPPET, UNIT_EXAMPLES, UNITS_SNIPPET } from './core-data';

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function CorePage() {
  const [rpcLogs, setRpcLogs] = useState<LogEntry[]>([]);
  const [rpcLoading, setRpcLoading] = useState(false);

  const [codecInput, setCodecInput] = useState('');
  const [codecResult, setCodecResult] = useState('');
  const [codecError, setCodecError] = useState('');

  async function fetchBlockNumber() {
    setRpcLoading(true);
    const start = Date.now();
    try {
      const res = await fetch('/api/rpc/espace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
      });
      const json = await res.json();
      const elapsed = Date.now() - start;
      const blockHex: string = json.result;
      const block = blockHex ? Number.parseInt(blockHex, 16) : null;
      setRpcLogs((l) => [
        ...l,
        makeEntry(`eth_blockNumber → ${block ?? '?'} (${elapsed}ms)`, 'info'),
      ]);
    } catch (e) {
      setRpcLogs((l) => [...l, makeEntry(String(e), 'error')]);
    } finally {
      setRpcLoading(false);
    }
  }

  function convertAddress() {
    setCodecError('');
    setCodecResult('');
    const v = codecInput.trim();
    if (!v) return;
    try {
      if (v.startsWith('0x') || v.startsWith('0X')) {
        // hex → base32 (testnet networkId = 1)
        setCodecResult(hexToBase32(v as `0x${string}`, 1));
      } else {
        setCodecResult(base32ToHex(v));
      }
    } catch (e) {
      setCodecError(String(e));
    }
  }

  return (
    <SiteLayout>
      {/* ── Client Architecture ── */}
      <DemoCard
        title="createClient — eSpace & Core Space"
        description="@cfxdevkit/core ships two typed RPC clients. CfxProvider distributes a client to React hooks — no wallet needed for reads."
      >
        <CodeSnippet code={CLIENT_SNIPPET} label="Usage" />
      </DemoCard>

      {/* ── Chain list ── */}
      <DemoCard
        title="Available Chains"
        description="Static chain catalog from listChains() — covers eSpace and Core Space across all networks."
      >
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cfx-text-sm)' }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cfx-color-border-default)' }}>
              {['Name', 'Family', 'Network', 'Chain ID', 'RPC'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: 'var(--cfx-space-2) var(--cfx-space-3)',
                    color: 'var(--cfx-color-fg-subtle)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CHAINS.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--cfx-color-border-subtle)' }}>
                <td style={{ padding: 'var(--cfx-space-2) var(--cfx-space-3)' }}>
                  {c.displayName}
                </td>
                <td
                  style={{
                    padding: 'var(--cfx-space-2) var(--cfx-space-3)',
                    color: 'var(--cfx-color-fg-subtle)',
                  }}
                >
                  {c.family}
                </td>
                <td
                  style={{
                    padding: 'var(--cfx-space-2) var(--cfx-space-3)',
                    color: 'var(--cfx-color-fg-subtle)',
                  }}
                >
                  {c.network}
                </td>
                <td
                  style={{
                    padding: 'var(--cfx-space-2) var(--cfx-space-3)',
                    fontFamily: 'monospace',
                  }}
                >
                  {c.id}
                </td>
                <td
                  style={{
                    padding: 'var(--cfx-space-2) var(--cfx-space-3)',
                    color: 'var(--cfx-color-fg-muted)',
                    fontFamily: 'monospace',
                    fontSize: 'var(--cfx-text-xs)',
                  }}
                >
                  {c.rpc.http[0]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DemoCard>

      {/* ── Live RPC ── */}
      <DemoCard
        title="Live RPC Call"
        description="POST to /api/rpc/espace → eth_blockNumber on eSpace testnet."
      >
        <button
          type="button"
          onClick={fetchBlockNumber}
          disabled={rpcLoading}
          style={{
            padding: 'var(--cfx-space-2) var(--cfx-space-4)',
            background: 'var(--cfx-color-brand-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--cfx-radius-md)',
            cursor: rpcLoading ? 'not-allowed' : 'pointer',
            fontSize: 'var(--cfx-text-sm)',
            marginBottom: 'var(--cfx-space-3)',
          }}
        >
          {rpcLoading ? 'Fetching…' : 'Fetch Block Number'}
        </button>
        <LogBox entries={rpcLogs} empty="Click the button to make a live RPC call." />
      </DemoCard>

      {/* ── Address codec ── */}
      <DemoCard
        title="Address Codec"
        description="Convert between hex (0x…) and base32 (cfxtest:…) addresses. Core Space uses base32; eSpace uses hex."
      >
        <div
          style={{
            display: 'flex',
            gap: 'var(--cfx-space-2)',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <input
            value={codecInput}
            onChange={(e) => setCodecInput(e.target.value)}
            placeholder="0x… or cfxtest:…"
            style={{
              flex: 1,
              minWidth: 240,
              padding: 'var(--cfx-space-2) var(--cfx-space-3)',
              background: 'var(--cfx-color-bg-emphasis)',
              border: '1px solid var(--cfx-color-border-default)',
              borderRadius: 'var(--cfx-radius-md)',
              color: 'var(--cfx-color-fg-default)',
              fontSize: 'var(--cfx-text-sm)',
            }}
          />
          <button
            type="button"
            onClick={convertAddress}
            style={{
              padding: 'var(--cfx-space-2) var(--cfx-space-4)',
              background: 'var(--cfx-color-brand-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--cfx-radius-md)',
              cursor: 'pointer',
              fontSize: 'var(--cfx-text-sm)',
            }}
          >
            Convert
          </button>
        </div>
        {codecError && (
          <p
            style={{
              color: 'var(--cfx-color-feedback-danger)',
              fontSize: 'var(--cfx-text-sm)',
              marginTop: 'var(--cfx-space-2)',
            }}
          >
            {codecError}
          </p>
        )}
        {codecResult && (
          <div style={{ marginTop: 'var(--cfx-space-3)' }}>
            <CodeSnippet code={codecResult} label="Result" />
          </div>
        )}
        {!codecResult && !codecError && (
          <p
            style={{
              color: 'var(--cfx-color-fg-muted)',
              fontSize: 'var(--cfx-text-sm)',
              marginTop: 'var(--cfx-space-2)',
            }}
          >
            Enter a hex address to get its base32 form (testnet networkId=1), or a base32 address to
            get hex.
          </p>
        )}
        <CodeSnippet code={CODEC_SNIPPET} label="API reference" />
      </DemoCard>

      {/* ── Unit formatting ── */}
      <DemoCard
        title="Unit Formatting"
        description="formatCFX, formatGDrip, and parseCFX for drip ↔ human-readable conversions."
      >
        {UNIT_EXAMPLES.map((ex) => (
          <div key={ex.label} style={{ marginBottom: 'var(--cfx-space-3)' }}>
            <CodeSnippet code={`${ex.label}\n// → ${ex.value}`} />
          </div>
        ))}
        <CodeSnippet code={UNITS_SNIPPET} label="API reference" />
      </DemoCard>
    </SiteLayout>
  );
}
