import { bridge } from '@cfxdevkit/contracts';
import { pretty } from './core-panel-basics.js';

export type LookupKind = 'tx' | 'receipt' | 'admin' | 'sponsor' | 'logs';
export type BridgeKind = 'transfer' | 'withdraw';

export interface LookupsSectionProps {
  lookupHash: string;
  lookupAddr: string;
  lookupKind: LookupKind;
  lookupOut: unknown;
  lookupErr: string | null;
  lookupBusy: boolean;
  setLookupHash: (value: string) => void;
  setLookupAddr: (value: string) => void;
  setLookupKind: (value: LookupKind) => void;
  runLookup: () => void;
}

export function LookupsSection({
  lookupHash,
  lookupAddr,
  lookupKind,
  lookupOut,
  lookupErr,
  lookupBusy,
  setLookupHash,
  setLookupAddr,
  setLookupKind,
  runLookup,
}: LookupsSectionProps) {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>Lookups</h3>
      <div className="row" style={{ gap: 8 }}>
        <label style={{ flex: '0 0 160px' }}>
          <span>kind</span>
          <select value={lookupKind} onChange={(e) => setLookupKind(e.target.value as LookupKind)}>
            <option value="tx">getTransaction(hash)</option>
            <option value="receipt">getTransactionReceipt(hash)</option>
            <option value="admin">getAdmin(contract)</option>
            <option value="sponsor">getSponsorInfo(contract)</option>
            <option value="logs">getLogs({'{epoch:-100}'})</option>
          </select>
        </label>
        {(lookupKind === 'tx' || lookupKind === 'receipt') && (
          <label style={{ flex: 1 }}>
            <span>tx hash</span>
            <input
              value={lookupHash}
              onChange={(e) => setLookupHash(e.target.value.trim())}
              placeholder="0x…"
              spellCheck={false}
            />
          </label>
        )}
        {(lookupKind === 'admin' || lookupKind === 'sponsor' || lookupKind === 'logs') && (
          <label style={{ flex: 1 }}>
            <span>contract address</span>
            <input
              value={lookupAddr}
              onChange={(e) => setLookupAddr(e.target.value.trim())}
              placeholder="cfx:… / cfxtest:…"
              spellCheck={false}
            />
          </label>
        )}
        <button type="button" className="primary" onClick={runLookup} disabled={lookupBusy}>
          {lookupBusy ? 'Querying…' : 'Run'}
        </button>
      </div>
      {lookupErr && <p className="error">{lookupErr}</p>}
      {lookupOut !== null && <pre className="result">{pretty(lookupOut)}</pre>}
    </div>
  );
}

export interface BridgeSectionProps {
  signer: unknown;
  active: { evmAddress: `0x${string}` } | null | undefined;
  bridgeAmt: string;
  bridgeKind: BridgeKind;
  bridgeTo: string;
  bridgeOut: string | null;
  bridgeErr: string | null;
  bridgeBusy: boolean;
  setBridgeAmt: (value: string) => void;
  setBridgeKind: (value: BridgeKind) => void;
  setBridgeTo: (value: string) => void;
  runBridge: () => void;
}

export function BridgeSection({
  signer,
  active,
  bridgeAmt,
  bridgeKind,
  bridgeTo,
  bridgeOut,
  bridgeErr,
  bridgeBusy,
  setBridgeAmt,
  setBridgeKind,
  setBridgeTo,
  runBridge,
}: BridgeSectionProps) {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>Cross-space bridge</h3>
      <p className="muted" style={{ fontSize: 12 }}>
        Calls the <strong>CrossSpaceCall</strong> internal contract at{' '}
        <code className="mono">{bridge.CROSS_SPACE_CALL_HEX}</code>. <em>transfer</em> moves CFX
        Core → eSpace; <em>withdraw</em> recalls CFX from your mapped eSpace account back to Core.
      </p>
      {!signer && (
        <p className="muted">Connect a wallet on the Wallet tab to enable bridge writes.</p>
      )}
      <div className="row" style={{ gap: 8 }}>
        <label style={{ flex: '0 0 160px' }}>
          <span>direction</span>
          <select value={bridgeKind} onChange={(e) => setBridgeKind(e.target.value as BridgeKind)}>
            <option value="transfer">Core → eSpace (transferEVM)</option>
            <option value="withdraw">eSpace → Core (withdrawFromMapped)</option>
          </select>
        </label>
        <label style={{ flex: '0 0 160px' }}>
          <span>amount (CFX)</span>
          <input value={bridgeAmt} onChange={(e) => setBridgeAmt(e.target.value)} />
        </label>
        {bridgeKind === 'transfer' && (
          <label style={{ flex: 1 }}>
            <span>to (eSpace 0x…) — empty = your mapped account</span>
            <input
              value={bridgeTo}
              onChange={(e) => setBridgeTo(e.target.value.trim())}
              placeholder={active ? bridge.mappedEspaceAddress(active.evmAddress) : '0x…'}
              spellCheck={false}
            />
          </label>
        )}
        <button
          type="button"
          className="primary"
          onClick={runBridge}
          disabled={bridgeBusy || !signer}
        >
          {bridgeBusy ? 'Sending…' : 'Send'}
        </button>
      </div>
      {bridgeErr && <p className="error">{bridgeErr}</p>}
      {bridgeOut && <pre className="result">tx hash: {bridgeOut}</pre>}
    </div>
  );
}
