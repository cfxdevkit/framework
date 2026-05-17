'use client';

import { base32ToHex, hexToBase32 } from '@cfxdevkit/core';
import { CodeSnippet, DemoCard } from '@cfxdevkit/example-showcase-ui';
import { useState } from 'react';
import { CHAINS, CLIENT_SNIPPET, CODEC_SNIPPET, UNIT_EXAMPLES, UNITS_SNIPPET } from './core-data';

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
  flex: 1,
  minWidth: 240,
  padding: 'var(--cfx-space-2) var(--cfx-space-3)',
  background: 'var(--cfx-color-bg-emphasis)',
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-md)',
  color: 'var(--cfx-color-fg-default)',
  fontSize: 'var(--cfx-text-sm)',
};

export function ClientArchitectureCard() {
  return (
    <DemoCard
      title="createClient — eSpace & Core Space"
      description="@cfxdevkit/core ships two typed RPC clients. CfxProvider distributes a client to React hooks — no wallet needed for reads."
    >
      <CodeSnippet code={CLIENT_SNIPPET} label="Usage" />
    </DemoCard>
  );
}

export function ChainCatalogCard() {
  return (
    <DemoCard
      title="Available Chains"
      description="Static chain catalog from listChains() — covers eSpace and Core Space across all networks."
    >
      <table style={tableStyle}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--cfx-color-border-default)' }}>
            {['Name', 'Family', 'Network', 'Chain ID', 'RPC'].map((heading) => (
              <th key={heading} style={headingStyle}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CHAINS.map((chain) => (
            <tr key={chain.id} style={{ borderBottom: '1px solid var(--cfx-color-border-subtle)' }}>
              <td style={cellStyle}>{chain.displayName}</td>
              <td style={mutedCellStyle}>{chain.family}</td>
              <td style={mutedCellStyle}>{chain.network}</td>
              <td style={monoCellStyle}>{chain.id}</td>
              <td style={rpcCellStyle}>{chain.rpc.http[0]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DemoCard>
  );
}

export function AddressCodecCard() {
  const [codecInput, setCodecInput] = useState('');
  const [codecResult, setCodecResult] = useState('');
  const [codecError, setCodecError] = useState('');

  function convertAddress() {
    setCodecError('');
    setCodecResult('');
    const value = codecInput.trim();
    if (!value) return;
    try {
      setCodecResult(
        value.startsWith('0x') || value.startsWith('0X')
          ? hexToBase32(value as `0x${string}`, 1)
          : base32ToHex(value),
      );
    } catch (error) {
      setCodecError(String(error));
    }
  }

  return (
    <DemoCard
      title="Address Codec"
      description="Convert between hex (0x…) and base32 (cfxtest:…) addresses. Core Space uses base32; eSpace uses hex."
    >
      <div style={controlRowStyle}>
        <input
          value={codecInput}
          onChange={(event) => setCodecInput(event.target.value)}
          placeholder="0x… or cfxtest:…"
          style={INPUT_STYLE}
        />
        <button type="button" onClick={convertAddress} style={BUTTON_STYLE}>
          Convert
        </button>
      </div>
      {codecError && <p style={errorTextStyle}>{codecError}</p>}
      {codecResult && (
        <div style={{ marginTop: 'var(--cfx-space-3)' }}>
          <CodeSnippet code={codecResult} label="Result" />
        </div>
      )}
      {!codecResult && !codecError && (
        <p style={hintTextStyle}>
          Enter a hex address to get its base32 form (testnet networkId=1), or a base32 address to
          get hex.
        </p>
      )}
      <CodeSnippet code={CODEC_SNIPPET} label="API reference" />
    </DemoCard>
  );
}

export function UnitFormattingCard() {
  return (
    <DemoCard
      title="Unit Formatting"
      description="formatCFX, formatGDrip, and parseCFX for drip ↔ human-readable conversions."
    >
      {UNIT_EXAMPLES.map((example) => (
        <div key={example.label} style={{ marginBottom: 'var(--cfx-space-3)' }}>
          <CodeSnippet code={`${example.label}\n// → ${example.value}`} />
        </div>
      ))}
      <CodeSnippet code={UNITS_SNIPPET} label="API reference" />
    </DemoCard>
  );
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 'var(--cfx-text-sm)',
};
const cellStyle: React.CSSProperties = { padding: 'var(--cfx-space-2) var(--cfx-space-3)' };
const headingStyle: React.CSSProperties = {
  ...cellStyle,
  textAlign: 'left',
  color: 'var(--cfx-color-fg-subtle)',
};
const mutedCellStyle: React.CSSProperties = {
  ...cellStyle,
  color: 'var(--cfx-color-fg-subtle)',
};
const monoCellStyle: React.CSSProperties = { ...cellStyle, fontFamily: 'monospace' };
const rpcCellStyle: React.CSSProperties = {
  ...cellStyle,
  color: 'var(--cfx-color-fg-muted)',
  fontFamily: 'monospace',
  fontSize: 'var(--cfx-text-xs)',
};
const controlRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--cfx-space-2)',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
};
const hintTextStyle: React.CSSProperties = {
  color: 'var(--cfx-color-fg-muted)',
  fontSize: 'var(--cfx-text-sm)',
  marginTop: 'var(--cfx-space-2)',
};
const errorTextStyle: React.CSSProperties = {
  ...hintTextStyle,
  color: 'var(--cfx-color-feedback-danger)',
};
