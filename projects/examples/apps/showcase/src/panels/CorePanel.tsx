/**
 * CorePanel — exhaustive demo of the `@cfxdevkit/core` Core Space surface.
 *
 * Sections, each backed by a single helper from the typed `CoreSpaceClient`
 * or its companion sub-paths:
 *
 * - **Status / heads** — `getStatus()`, `getEpochNumber()`
 * - **Address codec** — `hexToBase32`, `base32ToHex`, `getCoreAddress`
 *   (from `@cfxdevkit/core/address`)
 * - **Units** — `formatCFX`, `formatGDrip`, `parseCFX`
 * - **Account** — `getBalance(address)`, plus the bridge's
 *   `getMappedBalance` to peek at the connected account's *mapped* eSpace
 *   balance and `mappedEspaceAddress` to derive that address.
 * - **Lookups** — `getTransaction(hash)`, `getTransactionReceipt(hash)`,
 *   `getAdmin(contract)`, `getSponsorInfo(contract)`, `getLogs({ … })`
 * - **Bridge** — `transferToEspace`, `withdrawFromMapped` from
 *   `@cfxdevkit/contracts/bridge`. Requires a connected wallet.
 *
 * Everything below is bound to the chain selected via `<ChainProvider>` —
 * if the active chain isn't Core Space, the panel renders a single hint.
 */

import { bridge } from '@cfxdevkit/contracts';
import type { CoreLogFilter } from '@cfxdevkit/core';
import {
  base32ToHex,
  formatCFX,
  formatGDrip,
  getCoreAddress,
  hexToBase32,
  parseCFX,
} from '@cfxdevkit/core';
import { useCallback, useMemo, useState } from 'react';
import { useChain } from '../contexts/ChainProvider.js';
import { useWallet } from '../contexts/WalletProvider.js';

type Json = unknown;

function pretty(v: Json): string {
  return JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? `${x.toString()}n` : x), 2);
}

export function CorePanel() {
  const { chain, client } = useChain();
  const { active, signer } = useWallet();
  const isCore = chain.family === 'core';

  // ── Address codec -----------------------------------------------------------
  const [hexIn, setHexIn] = useState('0x1a2f80341409639ea6a35bbcab8299066109aa55');
  const [base32In, setBase32In] = useState('');
  const [codecOut, setCodecOut] = useState<string | null>(null);
  const [codecErr, setCodecErr] = useState<string | null>(null);

  const runHexToBase32 = useCallback(() => {
    setCodecErr(null);
    try {
      setCodecOut(hexToBase32(hexIn as `0x${string}`, chain.id));
    } catch (e) {
      setCodecErr(e instanceof Error ? e.message : String(e));
    }
  }, [hexIn, chain.id]);

  const runBase32ToHex = useCallback(() => {
    setCodecErr(null);
    try {
      setCodecOut(base32ToHex(base32In));
    } catch (e) {
      setCodecErr(e instanceof Error ? e.message : String(e));
    }
  }, [base32In]);

  const runCanonicalise = useCallback(() => {
    setCodecErr(null);
    try {
      setCodecOut(getCoreAddress(base32In || hexIn));
    } catch (e) {
      setCodecErr(e instanceof Error ? e.message : String(e));
    }
  }, [base32In, hexIn]);

  // ── Units -----------------------------------------------------------------
  const [cfxAmt, setCfxAmt] = useState('1.5');
  const unitsRow = useMemo(() => {
    try {
      const drip = parseCFX(cfxAmt);
      return {
        drip: drip.toString(),
        cfx: formatCFX(drip),
        gdrip: formatGDrip(drip),
      };
    } catch {
      return null;
    }
  }, [cfxAmt]);

  // ── Status & heads --------------------------------------------------------
  const [status, setStatus] = useState<unknown>(null);
  const [statusErr, setStatusErr] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!isCore || client.family !== 'core') return;
    setStatusBusy(true);
    setStatusErr(null);
    try {
      const [s, epoch] = await Promise.all([client.getStatus(), client.getEpochNumber()]);
      setStatus({ status: s, epochNumber: epoch });
    } catch (e) {
      setStatusErr(e instanceof Error ? e.message : String(e));
    } finally {
      setStatusBusy(false);
    }
  }, [client, isCore]);

  // ── Account / balance / mapped --------------------------------------------
  const [acct, setAcct] = useState<unknown>(null);
  const [acctErr, setAcctErr] = useState<string | null>(null);
  const [acctBusy, setAcctBusy] = useState(false);

  const refreshAccount = useCallback(async () => {
    if (!isCore || client.family !== 'core' || !active) return;
    setAcctBusy(true);
    setAcctErr(null);
    try {
      const balance = await client.getBalance(active.coreAddress);
      const mappedAddr = bridge.mappedEspaceAddress(active.evmAddress);
      const mappedBalance = await bridge.getMappedBalance({
        client,
        coreHexAddress: active.evmAddress,
      });
      setAcct({
        coreAddress: active.coreAddress,
        balance: `${formatCFX(balance)} CFX (${balance.toString()} drip)`,
        mappedEspaceAddress: mappedAddr,
        mappedBalance: `${formatCFX(mappedBalance)} CFX`,
      });
    } catch (e) {
      setAcctErr(e instanceof Error ? e.message : String(e));
    } finally {
      setAcctBusy(false);
    }
  }, [client, isCore, active]);

  // ── Lookups (tx / receipt / admin / sponsor / logs) -----------------------
  const [lookupHash, setLookupHash] = useState('');
  const [lookupAddr, setLookupAddr] = useState('');
  const [lookupKind, setLookupKind] = useState<'tx' | 'receipt' | 'admin' | 'sponsor' | 'logs'>(
    'tx',
  );
  const [lookupOut, setLookupOut] = useState<unknown>(null);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);

  const runLookup = useCallback(async () => {
    if (!isCore || client.family !== 'core') return;
    setLookupBusy(true);
    setLookupErr(null);
    setLookupOut(null);
    try {
      let out: unknown;
      switch (lookupKind) {
        case 'tx':
          out = await client.getTransaction(lookupHash as `0x${string}`);
          break;
        case 'receipt':
          out = await client.getTransactionReceipt(lookupHash as `0x${string}`);
          break;
        case 'admin':
          out = await client.getAdmin(lookupAddr);
          break;
        case 'sponsor':
          out = await client.getSponsorInfo(lookupAddr);
          break;
        case 'logs': {
          const epoch = await client.getEpochNumber();
          const filter: CoreLogFilter = {
            fromEpoch: epoch - 100n,
            toEpoch: epoch,
          };
          if (lookupAddr) filter.address = lookupAddr;
          out = await client.getLogs(filter);
          break;
        }
      }
      setLookupOut(out);
    } catch (e) {
      setLookupErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLookupBusy(false);
    }
  }, [client, isCore, lookupKind, lookupHash, lookupAddr]);

  // ── Bridge: Core → eSpace transfer + withdraw -----------------------------
  const [bridgeAmt, setBridgeAmt] = useState('0.01');
  const [bridgeKind, setBridgeKind] = useState<'transfer' | 'withdraw'>('transfer');
  const [bridgeTo, setBridgeTo] = useState('');
  const [bridgeOut, setBridgeOut] = useState<string | null>(null);
  const [bridgeErr, setBridgeErr] = useState<string | null>(null);
  const [bridgeBusy, setBridgeBusy] = useState(false);

  const runBridge = useCallback(async () => {
    if (!isCore || !signer) {
      setBridgeErr('Connect a wallet on the Wallet tab and pick a Core chain.');
      return;
    }
    setBridgeBusy(true);
    setBridgeErr(null);
    setBridgeOut(null);
    try {
      const value = parseCFX(bridgeAmt);
      const result =
        bridgeKind === 'transfer'
          ? await bridge.transferToEspace({
              client,
              signer,
              to: bridgeTo || (active ? bridge.mappedEspaceAddress(active.evmAddress) : ''),
              value,
            })
          : await bridge.withdrawFromMapped({ client, signer, value });
      setBridgeOut(result.hash);
    } catch (e) {
      setBridgeErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBridgeBusy(false);
    }
  }, [client, signer, isCore, bridgeAmt, bridgeKind, bridgeTo, active]);

  if (!isCore) {
    return (
      <section className="panel">
        <h2>Core Space</h2>
        <p className="panel-desc">
          This panel exhaustively exercises <code className="mono">@cfxdevkit/core</code> against a
          Conflux <strong>Core Space</strong> chain. Switch the chain selector at the top of the
          page to <code className="mono">core-mainnet</code> or{' '}
          <code className="mono">core-testnet</code>.
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Core Space — full surface</h2>
      <p className="panel-desc">
        Every helper in <code className="mono">@cfxdevkit/core</code> +{' '}
        <code className="mono">@cfxdevkit/contracts/bridge</code>, bound to the chain selected
        above. Address codec from <code className="mono">@cfxdevkit/core/address</code>; units from{' '}
        <code className="mono">@cfxdevkit/core/units</code>; the rest from the typed{' '}
        <code className="mono">CoreSpaceClient</code>.
      </p>

      {/* Address codec */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Address codec</h3>
        <p className="muted" style={{ fontSize: 12 }}>
          Convert between hex (<code>0x…</code>) and base32 (<code>cfx:…</code> /{' '}
          <code>cfxtest:…</code>). Network ID is taken from the active chain (
          <code>{chain.id}</code>).
        </p>
        <div className="row" style={{ gap: 8 }}>
          <label style={{ flex: 1 }}>
            <span>hex</span>
            <input
              value={hexIn}
              onChange={(e) => setHexIn(e.target.value.trim())}
              spellCheck={false}
            />
          </label>
          <label style={{ flex: 1 }}>
            <span>base32</span>
            <input
              value={base32In}
              onChange={(e) => setBase32In(e.target.value.trim())}
              spellCheck={false}
            />
          </label>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          <button type="button" onClick={runHexToBase32}>
            hexToBase32 →
          </button>
          <button type="button" onClick={runBase32ToHex}>
            ← base32ToHex
          </button>
          <button type="button" onClick={runCanonicalise}>
            getCoreAddress (validate)
          </button>
        </div>
        {codecOut && <pre className="result">{codecOut}</pre>}
        {codecErr && <p className="error">{codecErr}</p>}
      </div>

      {/* Units */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Units</h3>
        <label>
          <span>CFX amount</span>
          <input value={cfxAmt} onChange={(e) => setCfxAmt(e.target.value)} />
        </label>
        {unitsRow ? (
          <dl className="kv">
            <dt>parseCFX</dt>
            <dd>{unitsRow.drip} drip</dd>
            <dt>formatCFX</dt>
            <dd>{unitsRow.cfx}</dd>
            <dt>formatGDrip</dt>
            <dd>{unitsRow.gdrip}</dd>
          </dl>
        ) : (
          <p className="error">parse failed</p>
        )}
      </div>

      {/* Status */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Status & epoch</h3>
        <button type="button" className="primary" onClick={refreshStatus} disabled={statusBusy}>
          {statusBusy ? 'Querying…' : 'getStatus + getEpochNumber'}
        </button>
        {statusErr && <p className="error">{statusErr}</p>}
        {status !== null && <pre className="result">{pretty(status)}</pre>}
      </div>

      {/* Account */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Account & mapped balance</h3>
        {!active && (
          <p className="muted">Connect a wallet on the Wallet tab to enable this section.</p>
        )}
        {active && (
          <>
            <button type="button" className="primary" onClick={refreshAccount} disabled={acctBusy}>
              {acctBusy
                ? 'Querying…'
                : 'getBalance + bridge.getMappedBalance + mappedEspaceAddress'}
            </button>
            {acctErr && <p className="error">{acctErr}</p>}
            {acct !== null && <pre className="result">{pretty(acct)}</pre>}
          </>
        )}
      </div>

      {/* Lookups */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Lookups</h3>
        <div className="row" style={{ gap: 8 }}>
          <label style={{ flex: '0 0 160px' }}>
            <span>kind</span>
            <select
              value={lookupKind}
              onChange={(e) => setLookupKind(e.target.value as typeof lookupKind)}
            >
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

      {/* Bridge */}
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
            <select
              value={bridgeKind}
              onChange={(e) => setBridgeKind(e.target.value as typeof bridgeKind)}
            >
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
    </section>
  );
}
