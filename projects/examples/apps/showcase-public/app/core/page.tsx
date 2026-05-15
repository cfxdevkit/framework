'use client';

import {
  base32ToHex,
  formatCFX,
  formatGDrip,
  hexToBase32,
  listChains,
  parseCFX,
} from '@cfxdevkit/core';
import type { LogEntry } from '@cfxdevkit/example-showcase-ui';
import {
  CodeSnippet,
  DemoCard,
  LogBox,
  makeEntry,
  StatusBadge,
} from '@cfxdevkit/example-showcase-ui';
import { useState } from 'react';
import { SiteLayout } from '../site-layout';

const CHAINS = listChains();

const UNIT_EXAMPLES = [
  { label: 'formatCFX(1_000_000_000_000_000_000n)', value: formatCFX(1_000_000_000_000_000_000n) },
  { label: 'formatGDrip(1_000_000_000n)', value: formatGDrip(1_000_000_000n) },
  { label: 'parseCFX("1.5") → drip', value: String(parseCFX('1.5')) },
];

const CLIENT_SNIPPET = `// @cfxdevkit/core — low-level RPC clients for eSpace and Core Space
import { createClient, http, espaceTestnet, coreSpaceTestnet } from '@cfxdevkit/core';

// eSpace client (EVM-compatible, uses viem under the hood)
const espaceClient = createClient({
  chain: espaceTestnet,   // chain ID 71
  transport: http(),       // uses chain.rpc.http[0] by default
});

// Core Space client (Conflux-native JSON-RPC)
const coreClient = createClient({
  chain: coreSpaceTestnet, // chain ID 1
  transport: http(),
});

// Read-only calls — no wallet needed
const blockNumber = await espaceClient.getBlockNumber();
const balance = await espaceClient.getBalance('0xYourAddress');
const coreBalance = await coreClient.getBalance('cfxtest:aaYourAddress');

// Within React, consume via CfxProvider + useClient()
import { CfxProvider, useClient, useNativeBalance } from '@cfxdevkit/react';

<CfxProvider client={espaceClient}>
  {/* all children can now call useClient() */}
</CfxProvider>

// In a child component:
const client = useClient();
const { data: balance } = useNativeBalance({ address });`;

const CODEC_SNIPPET = `import { hexToBase32, base32ToHex, isBase32Address } from '@cfxdevkit/core';

hexToBase32('0xABC…', 1)   // → 'cfxtest:aac…'  (networkId=1 for testnet)
hexToBase32('0xABC…', 1029) // → 'cfx:aac…'      (networkId=1029 for mainnet)
base32ToHex('cfxtest:aac…') // → '0xabc…'
isBase32Address('cfx:aac…') // → true`;

const UNITS_SNIPPET = `import { formatCFX, formatGDrip, parseCFX } from '@cfxdevkit/core';

formatCFX(1_000_000_000_000_000_000n)  // → '1 CFX'
formatGDrip(1_000_000_000n)            // → '1 GDrip'
parseCFX('1.5')                        // → 1500000000000000000n  (drip)`;

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
