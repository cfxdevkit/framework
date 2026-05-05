import type { ReactNode } from 'react';
import type { DevNodeStatusSnapshot } from './devnode-client.js';
import type { TxDraft } from './wallet-actions.js';

const TX_FIELDS = [
  'to',
  'value',
  'nonce',
  'gas',
  'gasPrice',
  'maxFeePerGas',
  'maxPriorityFeePerGas',
  'storageLimit',
  'epochHeight',
  'data',
] as const;

export interface WalletResults {
  status: string;
  address: string;
  coreAddress: string;
  balance: string;
  rawTx: string;
  txHash: string;
  contractAddress: string;
  contractName: string;
  notice: string;
}

export function Field(props: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange(value: string): void;
}) {
  const id = `field-${props.label}`;
  return (
    <div className="form-row">
      <label htmlFor={id}>{props.label}</label>
      <input
        id={id}
        value={props.value}
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}

export function TxFields(props: {
  draft: TxDraft;
  onChange(update: (current: TxDraft) => TxDraft): void;
}) {
  return (
    <div className="form-grid compact">
      {TX_FIELDS.map((key) => (
        <Field
          key={key}
          label={key}
          value={props.draft[key]}
          onChange={(value) => props.onChange((current) => ({ ...current, [key]: value }))}
        />
      ))}
    </div>
  );
}

export function Results(props: { results: WalletResults }) {
  return (
    <dl className="results">
      <Result label="Status" value={props.results.status} />
      <Result label="Last result" value={props.results.notice || 'no completed operation yet'} />
      <Result label="Address" value={props.results.address || 'not connected'} />
      <Result label="Core address" value={props.results.coreAddress || 'not connected'} />
      <Result label="Balance" value={props.results.balance || 'not loaded'} />
      <Result label="Raw output" value={props.results.rawTx || 'not signed'} wrap />
      <Result label="Tx hash" value={props.results.txHash || 'not broadcast'} wrap />
      <Result label="Contract" value={props.results.contractName || 'not deployed'} />
      <Result
        label="Contract address"
        value={props.results.contractAddress || 'not deployed'}
        wrap
      />
    </dl>
  );
}

export function BalancePanel(props: { balance: string; txHash: string }) {
  return (
    <section className="summary-grid">
      <div>
        <span>Balance</span>
        <strong>{props.balance}</strong>
      </div>
      <div>
        <span>Last transaction</span>
        <strong className="mono wrap">{props.txHash || 'not broadcast'}</strong>
      </div>
    </section>
  );
}

export function TransferPanel(props: {
  mode: 'core' | 'espace';
  to: string;
  amount: string;
  onToChange(value: string): void;
  onAmountChange(value: string): void;
  children: ReactNode;
}) {
  return (
    <section className="subpanel">
      <div className="subpanel-header">
        <div>
          <h2>Transfer</h2>
          <p>Send native CFX from the active signer. Ledger is the current hardware signer.</p>
        </div>
      </div>
      <div className="form-grid">
        <Field label="Recipient" value={props.to} onChange={props.onToChange} />
        <Field label="Amount CFX" value={props.amount} onChange={props.onAmountChange} />
      </div>
      {props.mode === 'espace' ? (
        <p className="info-note">
          Local eSpace uses chain 2030; Ledger may show ??? for the native asset, but the amount is
          CFX.
        </p>
      ) : (
        <p className="info-note">
          Core Space uses the published `2.2.2` `SIGN_TX` APDU flow. Data-bearing transactions and
          contract deployment may require blind signing or display-data settings on the device.
        </p>
      )}
      {props.children}
    </section>
  );
}

export function DeployPanel(props: {
  mode: 'core' | 'espace';
  busy: boolean;
  connected: boolean;
  contractAddress: string;
  onDeploy(): void;
}) {
  return (
    <section className="subpanel">
      <div className="subpanel-header">
        <div>
          <h2>Deploy</h2>
          <p>Deploy the precompiled Basic ERC-20 example with the active keystore signer.</p>
        </div>
      </div>
      <div className="deploy-summary">
        <div>
          <span>Artifact</span>
          <strong>Basic ERC-20</strong>
        </div>
        <div>
          <span>Constructor</span>
          <strong>Ledger Demo Token / LDT / 1,000,000</strong>
        </div>
        <div>
          <span>Address</span>
          <strong className="mono wrap">{props.contractAddress || 'not deployed'}</strong>
        </div>
      </div>
      {props.mode === 'core' ? (
        <p className="info-note">
          Core deploy uses the same published `SIGN_TX` APDU flow as transfer signing. If the device
          rejects the request, check the app settings for blind signing or detailed data display.
        </p>
      ) : null}
      <div className="actions secondary">
        <button
          className="primary"
          type="button"
          onClick={props.onDeploy}
          disabled={!props.connected || props.busy}
        >
          Deploy ERC-20
        </button>
      </div>
    </section>
  );
}

export function DevNodePanel(props: {
  status: DevNodeStatusSnapshot | null;
  busy: boolean;
  connected: boolean;
  onStart(): void;
  onStop(): void;
  onRefresh(): void;
  onMine(): void;
  onFaucet(): void;
}) {
  const running = props.status?.running ?? false;
  return (
    <section className="subpanel">
      <div className="subpanel-header">
        <div>
          <h2>Local node</h2>
          <p>
            Start the devnode backend, pack pending transactions, and fund the connected address.
          </p>
        </div>
        <span className={`pill ${running ? 'ok' : 'warn'}`}>
          {props.status?.status ?? 'unknown'}
        </span>
      </div>
      <div className="actions secondary">
        <button type="button" onClick={props.onStart} disabled={props.busy || running}>
          Start node
        </button>
        <button type="button" onClick={props.onStop} disabled={props.busy || !running}>
          Stop node
        </button>
        <button type="button" onClick={props.onRefresh} disabled={props.busy}>
          Refresh node
        </button>
        <button type="button" onClick={props.onMine} disabled={props.busy || !running}>
          Pack txs
        </button>
        <button
          type="button"
          onClick={props.onFaucet}
          disabled={props.busy || !running || !props.connected}
        >
          Faucet connected address
        </button>
      </div>
    </section>
  );
}

function Result(props: { label: string; value: string; wrap?: boolean }) {
  return (
    <div>
      <dt>{props.label}</dt>
      <dd className={`mono ${props.wrap ? 'wrap' : ''}`}>{props.value}</dd>
    </div>
  );
}
