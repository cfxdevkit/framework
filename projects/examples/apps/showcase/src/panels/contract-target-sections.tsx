import type { Abi, AbiFunction } from 'viem';
import type { DeployNetworkId } from '../contexts/CompilerSession.js';
import { FunctionRow } from './contract-function-row.js';
import { NETWORK_LABEL } from './contract-interaction-helpers.js';

export interface InteractionTarget {
  address: string;
  abi: Abi;
  name: string;
  chainName: string;
  family: 'core' | 'espace';
  chainId: number;
  networkId: DeployNetworkId;
}

export function ManualContractForm({
  isCore,
  manualAddress,
  setManualAddress,
  manualAbiText,
  setManualAbiText,
  loadManual,
  manualParsed,
  manualErr,
}: {
  isCore: boolean;
  manualAddress: string;
  setManualAddress: (value: string) => void;
  manualAbiText: string;
  setManualAbiText: (value: string) => void;
  loadManual: () => void;
  manualParsed: { address: string; abi: Abi } | null;
  manualErr: string | null;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ display: 'block' }}>
        <span>Address ({isCore ? 'cfx: / cfxtest: / net2029:' : '0x...'})</span>
        <input
          type="text"
          value={manualAddress}
          onChange={(event) => setManualAddress(event.target.value.trim())}
          spellCheck={false}
          autoCapitalize="off"
          placeholder={isCore ? 'cfxtest:...' : '0x...'}
        />
      </label>
      <label style={{ display: 'block', marginTop: 8 }}>
        <span>ABI (JSON array)</span>
        <textarea
          value={manualAbiText}
          onChange={(event) => setManualAbiText(event.target.value)}
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
  );
}

export function TargetContractCard({
  target,
  wrongChain,
  chainName,
  chainId,
  reads,
  writes,
  isCore,
  signerReady,
  runRead,
  runWrite,
}: {
  target: InteractionTarget;
  wrongChain: boolean;
  chainName: string;
  chainId: number;
  reads: AbiFunction[];
  writes: AbiFunction[];
  isCore: boolean;
  signerReady: boolean;
  runRead: (fn: AbiFunction, args: unknown[]) => Promise<unknown>;
  runWrite: (fn: AbiFunction, args: unknown[]) => Promise<unknown>;
}) {
  const disabledReason = wrongChain ? 'Switch to the deployment’s chain to enable.' : undefined;
  return (
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
          This deployment is on <strong>{target.chainName}</strong> (chainId {target.chainId}) but
          the active chain is <strong>{chainName}</strong> (chainId {chainId}). Switch networks via
          the header pill before calling.
        </p>
      )}
      {reads.length > 0 && (
        <FunctionGroup
          title={`READ · ${reads.length}`}
          functions={reads}
          isCore={isCore}
          isWrite={false}
          signerReady={signerReady}
          disabled={wrongChain}
          disabledReason={disabledReason}
          run={runRead}
        />
      )}
      {writes.length > 0 && (
        <FunctionGroup
          title={`WRITE · ${writes.length}`}
          functions={writes}
          isCore={isCore}
          isWrite={true}
          signerReady={signerReady}
          disabled={wrongChain}
          disabledReason={disabledReason}
          run={runWrite}
        />
      )}
      {reads.length === 0 && writes.length === 0 && (
        <p className="muted">No callable functions in this ABI.</p>
      )}
    </div>
  );
}

function FunctionGroup({
  title,
  functions,
  run,
  ...rowProps
}: {
  title: string;
  functions: AbiFunction[];
  isCore: boolean;
  isWrite: boolean;
  signerReady: boolean;
  disabled: boolean;
  disabledReason: string | undefined;
  run: (fn: AbiFunction, args: unknown[]) => Promise<unknown>;
}) {
  return (
    <>
      <h4 style={{ margin: '12px 0 6px' }}>{title}</h4>
      {functions.map((fn) => (
        <FunctionRow
          key={`${title}-${fn.name}-${fn.inputs.map((input) => input.type).join(',')}`}
          fn={fn}
          run={(args) => run(fn, args)}
          {...rowProps}
        />
      ))}
    </>
  );
}
