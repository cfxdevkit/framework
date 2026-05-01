/**
 * `ContractInteractionPanel` — generic ABI-driven read/write console.
 *
 * Mirrors the contract tree in the `cfxdevkit-vscode-extension` sidebar
 * (see `packages/vscode-extension/src/views/contracts.ts`). Deployments are
 * grouped first by **environment** (mainnet / testnet / local / custom),
 * then by **chain** (Core / eSpace), exactly like the extension's
 * `NetworkGroup → ChainGroup → ContractItem → AbiGroupItem` hierarchy.
 *
 * The deploy log is now backed by `localStorage` (see `CompilerSession`),
 * so testnet and mainnet deploys survive across browser sessions —
 * mirroring the durable `<workspace>/deployments/contracts.json` tracker
 * that `@cfxdevkit/devkit-backend` writes from the VS Code extension.
 *
 * Reads dispatch through `@cfxdevkit/contracts.readContract`
 * (→ `eth_call` / `cfx_call`), writes through `sendWrite`
 * (→ `eth_sendRawTransaction` / `cfx_sendRawTransaction`), so this panel
 * exercises the same code path SDK consumers would use.
 *
 * On Core Space, address-typed args (`address` / `address[]`) are converted
 * from base32 to 0x-hex before ABI encoding — viem's encoder expects hex
 * even when the call is dispatched as `cfx_call`. The contract `address`
 * itself stays in base32 (it's the call target, not an ABI argument).
 *
 * The selected deployment can belong to a different network than the one
 * currently active. When that happens the panel displays a warning and
 * disables the action buttons until the user switches networks via the
 * header pill, preventing accidental wrong-chain calls.
 */

import { readContract } from '@cfxdevkit/contracts/read';
import { sendWrite } from '@cfxdevkit/contracts/write';
import { base32ToHex, isBase32Address } from '@cfxdevkit/core';
import { useCallback, useMemo, useState } from 'react';
import type { Abi, AbiFunction } from 'viem';
import { isAddress as isEspaceAddress } from 'viem';
import { useChain } from '../contexts/ChainProvider.js';
import {
  type DeployLogEntry,
  type DeployNetworkId,
  useCompilerSession,
} from '../contexts/CompilerSession.js';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { useWallet } from '../contexts/WalletProvider.js';

// ---- helpers --------------------------------------------------------------

function validateAddress(addr: string, family: 'core' | 'espace'): string | null {
  const trimmed = addr.trim();
  if (!trimmed) return 'Enter an address.';
  if (family === 'espace') {
    if (isEspaceAddress(trimmed)) return null;
    return 'Not a valid eSpace address.';
  }
  if (isBase32Address(trimmed)) return null;
  return 'Not a valid Core base32 address.';
}

function coerceAddressArgs(value: unknown, type: string, isCore: boolean): unknown {
  if (!isCore) return value;
  if (type === 'address' && typeof value === 'string' && isBase32Address(value)) {
    return base32ToHex(value);
  }
  if (type.startsWith('address[') && Array.isArray(value)) {
    return value.map((v) => coerceAddressArgs(v, 'address', isCore));
  }
  return value;
}

function parseArgs(
  raw: string,
  fn: AbiFunction,
): { ok: true; args: unknown[] } | { error: string } {
  if (fn.inputs.length === 0) return { ok: true, args: [] };
  const trimmed = raw.trim();
  if (trimmed === '') return { error: 'Expected a JSON array of arguments.' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e) {
    return { error: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (!Array.isArray(parsed)) return { error: 'Args must be a JSON array.' };
  if (parsed.length !== fn.inputs.length)
    return { error: `Expected ${fn.inputs.length} args, got ${parsed.length}.` };
  return { ok: true, args: parsed };
}

function placeholderFor(fn: AbiFunction): string {
  if (fn.inputs.length === 0) return 'no args';
  const sample = fn.inputs.map((i) => {
    if (i.type === 'address') return '"0x..."';
    if (i.type === 'string') return '"..."';
    if (i.type === 'bool') return 'true';
    if (i.type.startsWith('uint') || i.type.startsWith('int')) return '"100"';
    if (i.type.endsWith('[]')) return '[]';
    return '"..."';
  });
  return `[${sample.join(', ')}]`;
}

function stringifyResult(v: unknown): string {
  return JSON.stringify(v, (_k, val) => (typeof val === 'bigint' ? `${val.toString()}n` : val), 2);
}

const NETWORK_LABEL: Record<DeployNetworkId, string> = {
  mainnet: 'Mainnet',
  testnet: 'Testnet',
  local: 'Local devnode',
  custom: 'Custom',
};

const NETWORK_ORDER: DeployNetworkId[] = ['mainnet', 'testnet', 'local', 'custom'];

// ---- function row ---------------------------------------------------------

interface PendingResult {
  status: 'idle' | 'running' | 'ok' | 'err';
  output?: string;
  error?: string;
}

interface FunctionRowProps {
  fn: AbiFunction;
  isCore: boolean;
  isWrite: boolean;
  run: (args: unknown[]) => Promise<unknown>;
  signerReady: boolean;
  disabled?: boolean | undefined;
  disabledReason?: string | undefined;
}

function FunctionRow({
  fn,
  isCore,
  isWrite,
  run,
  signerReady,
  disabled,
  disabledReason,
}: FunctionRowProps) {
  const [argsRaw, setArgsRaw] = useState('');
  const [state, setState] = useState<PendingResult>({ status: 'idle' });

  const sig = useMemo(
    () =>
      `${fn.name}(${fn.inputs.map((i) => `${i.type}${i.name ? ` ${i.name}` : ''}`).join(', ')})`,
    [fn],
  );
  const isPayable = fn.stateMutability === 'payable';

  const onRun = useCallback(async () => {
    setState({ status: 'running' });
    const parsed = parseArgs(argsRaw, fn);
    if ('error' in parsed) {
      setState({ status: 'err', error: parsed.error });
      return;
    }
    try {
      const coerced = parsed.args.map((v, i) =>
        coerceAddressArgs(v, fn.inputs[i]?.type ?? 'unknown', isCore),
      );
      const result = await run(coerced);
      const output = isWrite
        ? ((result as { hash?: string }).hash ?? stringifyResult(result))
        : stringifyResult(result);
      setState({ status: 'ok', output });
    } catch (e) {
      setState({ status: 'err', error: e instanceof Error ? e.message : String(e) });
    }
  }, [argsRaw, fn, isCore, isWrite, run]);

  const buttonDisabled =
    state.status === 'running' || (isWrite && !signerReady) || Boolean(disabled);

  return (
    <div
      className="card"
      style={{
        marginBottom: 8,
        padding: 10,
        borderLeft: `3px solid ${isWrite ? 'var(--err)' : 'var(--accent-2)'}`,
      }}
    >
      <div className="row" style={{ alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <strong style={{ flex: '0 0 auto' }}>{fn.name}</strong>
        {isPayable && (
          <span className="space-badge" title="payable" style={{ background: 'var(--err)' }}>
            payable
          </span>
        )}
        <code className="mono small" style={{ flex: '1 1 auto', color: 'var(--muted)' }}>
          {sig}
        </code>
        <button
          type="button"
          className={isWrite ? 'primary' : 'secondary'}
          onClick={onRun}
          disabled={buttonDisabled}
          title={disabled ? disabledReason : undefined}
        >
          {state.status === 'running' ? '...' : isWrite ? 'Send' : 'Call'}
        </button>
      </div>
      {fn.inputs.length > 0 && (
        <input
          type="text"
          value={argsRaw}
          onChange={(e) => setArgsRaw(e.target.value)}
          placeholder={placeholderFor(fn)}
          spellCheck={false}
          autoCapitalize="off"
          style={{ marginTop: 6, fontFamily: 'var(--mono, monospace)', fontSize: 12 }}
        />
      )}
      {state.status === 'ok' && state.output !== undefined && (
        <pre
          className="mono small"
          style={{
            marginTop: 6,
            padding: 6,
            background: 'var(--bg-soft, rgba(0,0,0,0.2))',
            borderRadius: 4,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {state.output}
        </pre>
      )}
      {state.status === 'err' && state.error && (
        <p className="error" style={{ marginTop: 6, fontSize: 12 }}>
          {state.error}
        </p>
      )}
      {disabled && disabledReason && state.status === 'idle' && (
        <p className="muted small" style={{ marginTop: 4 }}>
          {disabledReason}
        </p>
      )}
      {!disabled && isWrite && !signerReady && state.status === 'idle' && (
        <p className="muted small" style={{ marginTop: 4 }}>
          Connect a wallet account to enable sending.
        </p>
      )}
    </div>
  );
}

// ---- main panel -----------------------------------------------------------

export function ContractInteractionPanel() {
  const { signer } = useWallet();
  const { chain, client } = useChain();
  const { network } = useNetwork();
  const { history, removeDeploy } = useCompilerSession();

  const isCore = chain.family === 'core';
  const family: 'core' | 'espace' = isCore ? 'core' : 'espace';

  // Group history by (networkId, family) — replicates the extension tree.
  const grouped = useMemo(() => {
    const map = new Map<DeployNetworkId, Map<'core' | 'espace', DeployLogEntry[]>>();
    for (const entry of history) {
      // Defensive: skip anything missing an ABI (legacy schema).
      if (!Array.isArray(entry.abi)) continue;
      const net = entry.networkId ?? 'custom';
      const fam = entry.family;
      if (!map.has(net)) map.set(net, new Map());
      const byFam = map.get(net) as Map<'core' | 'espace', DeployLogEntry[]>;
      if (!byFam.has(fam)) byFam.set(fam, []);
      (byFam.get(fam) as DeployLogEntry[]).push(entry);
    }
    return map;
  }, [history]);

  const [mode, setMode] = useState<'session' | 'manual'>('session');
  const [selectedId, setSelectedId] = useState<string>('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualAbiText, setManualAbiText] = useState('');
  const [manualErr, setManualErr] = useState<string | null>(null);
  const [manualParsed, setManualParsed] = useState<{ address: string; abi: Abi } | null>(null);

  // Effective deployment (active selection from history, or fallback to latest
  // matching the active network/family).
  const activeSession = useMemo<DeployLogEntry | null>(() => {
    if (selectedId) {
      const found = history.find((h) => h.id === selectedId);
      if (found) return found;
    }
    return (
      history.find((h) => h.networkId === network.id && h.family === family) ?? history[0] ?? null
    );
  }, [history, selectedId, network.id, family]);

  const target =
    mode === 'session' && activeSession
      ? {
          address: activeSession.address,
          abi: activeSession.abi,
          name: activeSession.contractName,
          chainName: activeSession.chainName,
          family: activeSession.family,
          chainId: activeSession.chainId,
          networkId: activeSession.networkId,
        }
      : mode === 'manual' && manualParsed
        ? {
            address: manualParsed.address,
            abi: manualParsed.abi,
            name: 'Manual',
            chainName: chain.name,
            family,
            chainId: chain.id,
            networkId: network.id,
          }
        : null;

  // If the selected deployment doesn't match the active chain, all calls
  // would go to the wrong network. Surface a warning + block the buttons.
  const wrongChain = target ? target.chainId !== chain.id || target.family !== family : false;

  const loadManual = useCallback(() => {
    setManualErr(null);
    const addrErr = validateAddress(manualAddress, family);
    if (addrErr) {
      setManualErr(addrErr);
      setManualParsed(null);
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(manualAbiText);
    } catch (e) {
      setManualErr(`Invalid ABI JSON: ${e instanceof Error ? e.message : String(e)}`);
      setManualParsed(null);
      return;
    }
    if (!Array.isArray(parsed)) {
      setManualErr('ABI must be a JSON array.');
      setManualParsed(null);
      return;
    }
    setManualParsed({ address: manualAddress.trim(), abi: parsed as Abi });
  }, [manualAddress, manualAbiText, family]);

  const { reads, writes } = useMemo(() => {
    if (!target) return { reads: [] as AbiFunction[], writes: [] as AbiFunction[] };
    const fns = target.abi.filter((e): e is AbiFunction => e.type === 'function');
    return {
      reads: fns.filter((f) => f.stateMutability === 'view' || f.stateMutability === 'pure'),
      writes: fns.filter(
        (f) => f.stateMutability === 'nonpayable' || f.stateMutability === 'payable',
      ),
    };
  }, [target]);

  return (
    <section className="panel">
      <h2>Contract interaction</h2>
      <p className="panel-desc">
        Generic ABI-driven read/write console — mirrors the{' '}
        <code className="mono">cfxdevkit.abiCallRead</code> /{' '}
        <code className="mono">cfxdevkit.abiCallWrite</code> commands in the VS Code extension.
        Deployments are persisted across browser sessions in{' '}
        <code className="mono">localStorage</code> and grouped by environment (mainnet / testnet /
        local), matching the extension's contract tree.
      </p>

      <div className="row" style={{ gap: 6 }}>
        <button
          type="button"
          className={mode === 'session' ? 'primary' : 'secondary'}
          onClick={() => setMode('session')}
        >
          Saved deployments ({history.length})
        </button>
        <button
          type="button"
          className={mode === 'manual' ? 'primary' : 'secondary'}
          onClick={() => setMode('manual')}
        >
          Manual address + ABI
        </button>
      </div>

      {mode === 'session' && (
        <div style={{ marginTop: 12 }}>
          {history.length === 0 ? (
            <p className="muted">
              No deploys recorded yet. Use the Compiler tab to compile + deploy a template, or
              switch to "Manual address + ABI".
            </p>
          ) : (
            <div className="card" style={{ padding: 8 }}>
              {NETWORK_ORDER.map((netId) => {
                const byFam = grouped.get(netId);
                if (!byFam) return null;
                return (
                  <div key={netId} style={{ marginBottom: 8 }}>
                    <div
                      className="muted small"
                      style={{ textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}
                    >
                      {NETWORK_LABEL[netId]}
                    </div>
                    {(['core', 'espace'] as const).map((fam) => {
                      const items = byFam.get(fam);
                      if (!items || items.length === 0) return null;
                      return (
                        <div key={fam} style={{ marginLeft: 8, marginBottom: 4 }}>
                          <div className="small" style={{ marginBottom: 2 }}>
                            <span className={`space-badge space-${fam}`}>
                              {fam === 'core' ? 'Core' : 'eSpace'}
                            </span>{' '}
                            <span className="muted">({items.length})</span>
                          </div>
                          {items.map((h) => {
                            const isSelected = (activeSession?.id ?? '') === h.id;
                            return (
                              <div
                                key={h.id}
                                className="row"
                                style={{
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '2px 6px',
                                  background: isSelected ? 'var(--bg-soft, rgba(0,0,0,0.15))' : '',
                                  borderRadius: 4,
                                }}
                              >
                                <button
                                  type="button"
                                  className={isSelected ? 'primary' : 'secondary'}
                                  onClick={() => setSelectedId(h.id)}
                                  style={{ minWidth: 80 }}
                                >
                                  {isSelected ? 'Selected' : 'Select'}
                                </button>
                                <code className="mono small" style={{ flex: '1 1 auto' }}>
                                  {h.contractName} · {h.address.slice(0, 18)}...
                                </code>
                                <span className="muted small">chainId {h.chainId}</span>
                                <button
                                  type="button"
                                  className="secondary small"
                                  title="Remove from history"
                                  onClick={() => {
                                    if (selectedId === h.id) setSelectedId('');
                                    removeDeploy(h.id);
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block' }}>
            <span>Address ({isCore ? 'cfx: / cfxtest: / net2029:' : '0x...'})</span>
            <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value.trim())}
              spellCheck={false}
              autoCapitalize="off"
              placeholder={isCore ? 'cfxtest:...' : '0x...'}
            />
          </label>
          <label style={{ display: 'block', marginTop: 8 }}>
            <span>ABI (JSON array)</span>
            <textarea
              value={manualAbiText}
              onChange={(e) => setManualAbiText(e.target.value)}
              spellCheck={false}
              rows={6}
              style={{ width: '100%', fontFamily: 'var(--mono, monospace)', fontSize: 12 }}
              placeholder='[{"type":"function","name":"name","inputs":[],"outputs":[{"type":"string"}],"stateMutability":"view"}]'
            />
          </label>
          <div className="row" style={{ marginTop: 8, gap: 8 }}>
            <button type="button" className="primary" onClick={loadManual}>
              Load
            </button>
            {manualParsed && (
              <span className="muted small">Loaded: {manualParsed.abi.length} ABI entries.</span>
            )}
          </div>
          {manualErr && <p className="error">{manualErr}</p>}
        </div>
      )}

      {target && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>
            {target.name}{' '}
            <span className={`space-badge space-${target.family}`}>
              {target.family === 'core' ? 'Core' : 'eSpace'}
            </span>{' '}
            <span className="muted small">
              {NETWORK_LABEL[target.networkId]} · {target.chainName} · chainId {target.chainId}
            </span>
          </h3>
          <code
            className="mono small"
            style={{ display: 'block', wordBreak: 'break-all', marginBottom: 12 }}
          >
            {target.address}
          </code>

          {wrongChain && (
            <p className="error" style={{ marginBottom: 12 }}>
              This deployment is on <strong>{target.chainName}</strong> (chainId {target.chainId})
              but the active chain is <strong>{chain.name}</strong> (chainId {chain.id}). Switch
              networks via the header pill before calling.
            </p>
          )}

          {reads.length > 0 && (
            <>
              <h4 style={{ margin: '12px 0 6px' }}>READ · {reads.length}</h4>
              {reads.map((fn) => (
                <FunctionRow
                  key={`r-${fn.name}-${fn.inputs.map((i) => i.type).join(',')}`}
                  fn={fn}
                  isCore={isCore}
                  isWrite={false}
                  signerReady={!!signer}
                  disabled={wrongChain}
                  disabledReason={
                    wrongChain ? 'Switch to the deployment\u2019s chain to enable.' : undefined
                  }
                  run={(args) =>
                    readContract({
                      client,
                      address: target.address,
                      abi: target.abi,
                      functionName: fn.name,
                      args,
                    } as Parameters<typeof readContract>[0])
                  }
                />
              ))}
            </>
          )}

          {writes.length > 0 && (
            <>
              <h4 style={{ margin: '12px 0 6px' }}>WRITE · {writes.length}</h4>
              {writes.map((fn) => (
                <FunctionRow
                  key={`w-${fn.name}-${fn.inputs.map((i) => i.type).join(',')}`}
                  fn={fn}
                  isCore={isCore}
                  isWrite={true}
                  signerReady={!!signer}
                  disabled={wrongChain}
                  disabledReason={
                    wrongChain ? 'Switch to the deployment\u2019s chain to enable.' : undefined
                  }
                  run={(args) => {
                    if (!signer) throw new Error('No signer connected.');
                    return sendWrite({
                      client,
                      signer,
                      address: target.address as `0x${string}`,
                      abi: target.abi,
                      functionName: fn.name,
                      args,
                      waitForReceipt: true,
                    } as Parameters<typeof sendWrite>[0]);
                  }}
                />
              ))}
            </>
          )}

          {reads.length === 0 && writes.length === 0 && (
            <p className="muted">No callable functions in this ABI.</p>
          )}
        </div>
      )}
    </section>
  );
}
