'use client';

import type { LogEntry } from '@cfxdevkit/example-showcase-ui';
import { CodeSnippet, DemoCard, LogBox, makeEntry } from '@cfxdevkit/example-showcase-ui';
import { crossSpaceCallAddress } from '@cfxdevkit/protocol';
import { useState } from 'react';
import { SiteLayout } from '../site-layout';
import { LiveRpcCard } from './live-rpc-card';
import {
  AddressCodecCard,
  ChainCatalogCard,
  ClientArchitectureCard,
  UnitFormattingCard,
} from './overview-cards';

type RpcSpace = 'core' | 'espace';

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
const SELECT_STYLE: React.CSSProperties = {
  padding: 'var(--cfx-space-2) var(--cfx-space-3)',
  background: 'var(--cfx-color-bg-emphasis)',
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-md)',
  color: 'var(--cfx-color-fg-default)',
  fontSize: 'var(--cfx-text-sm)',
};
const CONTROL_ROW: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--cfx-space-2)',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
  marginBottom: 'var(--cfx-space-3)',
};

async function requestRpc(space: RpcSpace, method: string, params: unknown[] = []) {
  const res = await fetch(`/api/rpc/${space}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `RPC proxy failed with HTTP ${res.status}`);
  if (json.error) {
    const message = typeof json.error === 'string' ? json.error : json.error.message;
    throw new Error(message ?? `${method} failed`);
  }
  return json.result;
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function CorePage() {
  const [rpcLogs, setRpcLogs] = useState<LogEntry[]>([]);
  const [rpcLoading, setRpcLoading] = useState(false);

  const [blockLookupKind, setBlockLookupKind] = useState<'epoch' | 'hash'>('epoch');
  const [blockLookupInput, setBlockLookupInput] = useState('latest_mined');
  const [blockLookupLogs, setBlockLookupLogs] = useState<LogEntry[]>([]);
  const [blockLookupResult, setBlockLookupResult] = useState<unknown>(null);
  const [blockLookupLoading, setBlockLookupLoading] = useState(false);

  const [txHash, setTxHash] = useState('');
  const [txLookupLogs, setTxLookupLogs] = useState<LogEntry[]>([]);
  const [txLookupResult, setTxLookupResult] = useState<unknown>(null);
  const [receiptLookupResult, setReceiptLookupResult] = useState<unknown>(null);
  const [txLookupLoading, setTxLookupLoading] = useState(false);

  const [crossSpaceLogs, setCrossSpaceLogs] = useState<LogEntry[]>([]);
  const [crossSpaceResult, setCrossSpaceResult] = useState<unknown>(null);
  const [crossSpaceLoading, setCrossSpaceLoading] = useState(false);

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

  async function lookupBlock() {
    setBlockLookupLoading(true);
    setBlockLookupLogs([]);
    setBlockLookupResult(null);
    try {
      const input = blockLookupInput.trim();
      if (blockLookupKind === 'hash' && !input) throw new Error('Enter a block hash.');
      const method =
        blockLookupKind === 'hash' ? 'cfx_getBlockByHash' : 'cfx_getBlockByEpochNumber';
      const params = blockLookupKind === 'hash' ? [input, true] : [input || 'latest_mined', true];
      const result = await requestRpc('core', method, params);
      setBlockLookupResult(result);
      setBlockLookupLogs([makeEntry(`${method} succeeded.`, 'info')]);
    } catch (e) {
      setBlockLookupLogs([makeEntry(String(e), 'error')]);
    } finally {
      setBlockLookupLoading(false);
    }
  }

  async function lookupTransaction() {
    setTxLookupLoading(true);
    setTxLookupLogs([]);
    setTxLookupResult(null);
    setReceiptLookupResult(null);
    try {
      const hash = txHash.trim();
      if (!hash) throw new Error('Enter a transaction hash.');
      const [transaction, receipt] = await Promise.all([
        requestRpc('core', 'cfx_getTransactionByHash', [hash]),
        requestRpc('core', 'cfx_getTransactionReceipt', [hash]),
      ]);
      setTxLookupResult(transaction);
      setReceiptLookupResult(receipt);
      setTxLookupLogs([makeEntry('Transaction and receipt lookup completed.', 'info')]);
    } catch (e) {
      setTxLookupLogs([makeEntry(String(e), 'error')]);
    } finally {
      setTxLookupLoading(false);
    }
  }

  async function readCrossSpaceState() {
    setCrossSpaceLoading(true);
    setCrossSpaceLogs([]);
    setCrossSpaceResult(null);
    try {
      const [balance, nonce, logs] = await Promise.all([
        requestRpc('core', 'cfx_getBalance', [crossSpaceCallAddress, 'latest_state']),
        requestRpc('core', 'cfx_getNextNonce', [crossSpaceCallAddress, 'latest_state']),
        requestRpc('core', 'cfx_getLogs', [
          {
            address: crossSpaceCallAddress,
            fromEpoch: 'latest_checkpoint',
            toEpoch: 'latest_state',
          },
        ]),
      ]);
      setCrossSpaceResult({ crossSpaceCallAddress, balance, nonce, recentLogs: logs });
      setCrossSpaceLogs([makeEntry('CrossSpaceCall state read through Core RPC.', 'info')]);
    } catch (e) {
      setCrossSpaceLogs([makeEntry(String(e), 'error')]);
    } finally {
      setCrossSpaceLoading(false);
    }
  }

  return (
    <SiteLayout>
      <ClientArchitectureCard />
      <ChainCatalogCard />

      <LiveRpcCard loading={rpcLoading} logs={rpcLogs} onFetch={fetchBlockNumber} />

      <DemoCard
        title="Block Lookup"
        description="Read Core Space blocks by epoch tag/number or by block hash through the local RPC proxy."
      >
        <div style={CONTROL_ROW}>
          <select
            value={blockLookupKind}
            onChange={(e) => setBlockLookupKind(e.target.value as 'epoch' | 'hash')}
            style={SELECT_STYLE}
          >
            <option value="epoch">Epoch</option>
            <option value="hash">Hash</option>
          </select>
          <input
            value={blockLookupInput}
            onChange={(e) => setBlockLookupInput(e.target.value)}
            placeholder={blockLookupKind === 'hash' ? '0x block hash' : 'latest_mined or 0x epoch'}
            style={INPUT_STYLE}
          />
          <button
            type="button"
            onClick={lookupBlock}
            disabled={blockLookupLoading}
            style={{ ...BUTTON_STYLE, cursor: blockLookupLoading ? 'not-allowed' : 'pointer' }}
          >
            {blockLookupLoading ? 'Looking up…' : 'Lookup Block'}
          </button>
        </div>
        <LogBox entries={blockLookupLogs} empty="Choose an epoch or hash and query Core Space." />
        {blockLookupResult !== null && (
          <div style={{ marginTop: 'var(--cfx-space-3)' }}>
            <CodeSnippet code={pretty(blockLookupResult)} label="Block result" />
          </div>
        )}
      </DemoCard>

      <DemoCard
        title="Transaction and Receipt Lookup"
        description="Fetch cfx_getTransactionByHash and cfx_getTransactionReceipt together for a Core transaction hash."
      >
        <div style={CONTROL_ROW}>
          <input
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="0x transaction hash"
            style={INPUT_STYLE}
          />
          <button
            type="button"
            onClick={lookupTransaction}
            disabled={txLookupLoading}
            style={{ ...BUTTON_STYLE, cursor: txLookupLoading ? 'not-allowed' : 'pointer' }}
          >
            {txLookupLoading ? 'Looking up…' : 'Lookup Transaction'}
          </button>
        </div>
        <LogBox
          entries={txLookupLogs}
          empty="Paste a Core transaction hash to read the transaction and receipt."
        />
        {txLookupResult !== null && (
          <div style={{ marginTop: 'var(--cfx-space-3)' }}>
            <CodeSnippet code={pretty(txLookupResult)} label="Transaction" />
          </div>
        )}
        {receiptLookupResult !== null && (
          <div style={{ marginTop: 'var(--cfx-space-3)' }}>
            <CodeSnippet code={pretty(receiptLookupResult)} label="Receipt" />
          </div>
        )}
      </DemoCard>

      <DemoCard
        title="Cross-Space Read"
        description="Read the CrossSpaceCall internal contract through Core RPC to inspect eSpace bridge-related state without a wallet."
      >
        <button
          type="button"
          onClick={readCrossSpaceState}
          disabled={crossSpaceLoading}
          style={{
            ...BUTTON_STYLE,
            cursor: crossSpaceLoading ? 'not-allowed' : 'pointer',
            marginBottom: 'var(--cfx-space-3)',
          }}
        >
          {crossSpaceLoading ? 'Reading…' : 'Read CrossSpaceCall'}
        </button>
        <LogBox
          entries={crossSpaceLogs}
          empty="Click to read balance, nonce, and recent logs for the cross-space internal contract."
        />
        {crossSpaceResult !== null && (
          <div style={{ marginTop: 'var(--cfx-space-3)' }}>
            <CodeSnippet code={pretty(crossSpaceResult)} label="Cross-space state" />
          </div>
        )}
      </DemoCard>

      <AddressCodecCard />
      <UnitFormattingCard />
    </SiteLayout>
  );
}
