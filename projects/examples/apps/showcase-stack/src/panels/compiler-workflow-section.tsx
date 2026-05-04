import { WalletPickerModal } from '@cfxdevkit/example-showcase-ui';
import type { Dispatch, SetStateAction } from 'react';
import type { Hex } from 'viem';
import type { CompileTemplateResponse, TemplateMetaResponse } from '../lib/api.js';

export interface CompilerWorkflowSectionProps {
  address: string | undefined;
  isConnected: boolean;
  pickerOpen: boolean;
  setPickerOpen: (value: boolean) => void;
  loadErr: string | null;
  templates: TemplateMetaResponse[] | null;
  selectedId: string;
  setSelectedId: (value: string) => void;
  tpl: TemplateMetaResponse | null;
  activeSource: [string, string] | undefined;
  setSources: Dispatch<SetStateAction<Record<string, string>>>;
  setEdited: (value: boolean) => void;
  setArtifact: (value: CompileTemplateResponse | null) => void;
  compiling: boolean;
  compile: () => void;
  edited: boolean;
  artifact: CompileTemplateResponse | null;
  compileErr: string | null;
  argValues: Record<string, string>;
  setArgValues: Dispatch<SetStateAction<Record<string, string>>>;
  deploying: boolean;
  awaitingReceipt: boolean;
  deploy: () => void;
  deployErr: string | null;
  deployHash: Hex | null;
  receipt: { contractAddress?: string | null | undefined } | undefined;
}

export function CompilerWorkflowSection(props: CompilerWorkflowSectionProps) {
  return (
    <>
      <WalletSection {...props} />
      {props.loadErr && (
        <div className="result" style={{ color: 'var(--err)' }}>
          {props.loadErr}
        </div>
      )}
      {props.templates && <TemplatePicker {...props} />}
      {props.tpl && (
        <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
          {props.tpl.description} · solc {props.tpl.solcVersion}
        </p>
      )}
      {props.activeSource && <SourceEditor {...props} />}
      {props.tpl && <CompileButton {...props} />}
      {props.compileErr && (
        <div className="result" style={{ color: 'var(--err)', marginBottom: 12 }}>
          {props.compileErr}
        </div>
      )}
      {props.artifact?.warnings.map((warning) => (
        <div
          key={warning.message.slice(0, 40)}
          className="warning"
          style={{
            marginBottom: 8,
            color: warning.severity === 'warning' ? 'var(--warn)' : undefined,
          }}
        >
          {warning.message}
        </div>
      ))}
      {props.artifact && props.tpl && props.tpl.constructorArgs.length > 0 && (
        <ConstructorArgs {...props} />
      )}
      {props.artifact && props.isConnected && <DeployButton {...props} />}
      <DeployStatus {...props} />
    </>
  );
}

function WalletSection({
  address,
  isConnected,
  pickerOpen,
  setPickerOpen,
}: CompilerWorkflowSectionProps) {
  if (!isConnected) {
    return (
      <div className="panel" style={{ marginBottom: 16 }}>
        <p className="muted" style={{ margin: '0 0 10px' }}>
          Connect an eSpace wallet to deploy contracts.
        </p>
        <button type="button" className="primary" onClick={() => setPickerOpen(true)}>
          Connect eSpace Wallet
        </button>
        <WalletPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
      </div>
    );
  }
  return (
    <div className="row" style={{ marginBottom: 16 }}>
      <span className="space-badge space-espace">eSpace</span>
      <span className="mono" style={{ fontSize: 12 }}>
        {address}
      </span>
    </div>
  );
}

function TemplatePicker({ templates, selectedId, setSelectedId }: CompilerWorkflowSectionProps) {
  return (
    <label style={{ marginBottom: 16 }}>
      Template
      <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
        {templates?.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function SourceEditor({
  activeSource,
  setSources,
  setEdited,
  setArtifact,
}: CompilerWorkflowSectionProps) {
  if (!activeSource) return null;
  return (
    <label style={{ marginBottom: 16 }}>
      Source — {activeSource[0]}
      <textarea
        rows={12}
        value={activeSource[1]}
        onChange={(event) => {
          setSources((previous) => ({ ...previous, [activeSource[0]]: event.target.value }));
          setEdited(true);
          setArtifact(null);
        }}
        style={{ fontFamily: 'var(--mono)', fontSize: 11 }}
      />
    </label>
  );
}

function CompileButton({ compiling, compile, edited, artifact }: CompilerWorkflowSectionProps) {
  return (
    <div className="row" style={{ marginBottom: 16 }}>
      <button type="button" className="primary" disabled={compiling} onClick={compile}>
        {compiling ? 'Compiling…' : edited ? 'Compile (edited)' : 'Compile'}
      </button>
      {artifact && !edited && (
        <span className="muted" style={{ fontSize: 11 }}>
          {artifact.cached ? 'cached' : 'compiled'} · {artifact.bytecode.length / 2} bytes
        </span>
      )}
    </div>
  );
}

function ConstructorArgs({ tpl, argValues, setArgValues }: CompilerWorkflowSectionProps) {
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600 }}>Constructor arguments</h3>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        {tpl?.constructorArgs.map((arg) => (
          <label key={arg.name}>
            {arg.name}: {arg.type}
            <input
              value={argValues[arg.name] ?? ''}
              onChange={(e) =>
                setArgValues((previous) => ({ ...previous, [arg.name]: e.target.value }))
              }
              placeholder={arg.type}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function DeployButton({ deploying, awaitingReceipt, deploy }: CompilerWorkflowSectionProps) {
  return (
    <div className="row" style={{ marginBottom: 16 }}>
      <button
        type="button"
        className="primary"
        disabled={deploying || awaitingReceipt}
        onClick={deploy}
      >
        {deploying ? 'Sending…' : awaitingReceipt ? 'Waiting for receipt…' : 'Deploy to eSpace'}
      </button>
    </div>
  );
}

function DeployStatus({ deployErr, deployHash, receipt }: CompilerWorkflowSectionProps) {
  return (
    <>
      {deployErr && (
        <div className="result" style={{ color: 'var(--err)', marginBottom: 12 }}>
          {deployErr}
        </div>
      )}
      {deployHash && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
            Transaction hash
          </div>
          <span className="mono" style={{ fontSize: 12 }}>
            {deployHash}
          </span>
        </div>
      )}
      {receipt && (
        <div className="panel" style={{ marginBottom: 16, borderColor: 'var(--accent-2)' }}>
          <h3
            style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--accent-2)' }}
          >
            Deployed
          </h3>
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
            Contract address
          </div>
          <span className="mono" style={{ fontSize: 12 }}>
            {receipt.contractAddress ?? '—'}
          </span>
        </div>
      )}
    </>
  );
}
