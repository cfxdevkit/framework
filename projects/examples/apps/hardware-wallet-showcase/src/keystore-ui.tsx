import type { KeystoreBackendInfo, MemoryDemoResult } from './keystore-demo.js';

export function KeystoreBackendMatrix(props: {
  backends: readonly KeystoreBackendInfo[];
  active: string;
  onSelect(id: KeystoreBackendInfo['id']): void;
}) {
  return (
    <section className="backend-grid" aria-label="Keystore backends">
      {props.backends.map((backend) => (
        <button
          key={backend.id}
          type="button"
          className={`backend-card ${props.active === backend.id ? 'active' : ''}`}
          onClick={() => props.onSelect(backend.id)}
        >
          <span className={`backend-status ${backend.status}`}>{backend.status}</span>
          <strong>{backend.name}</strong>
          <span>{backend.storage}</span>
        </button>
      ))}
    </section>
  );
}

export function KeystoreBackendDetails(props: {
  backend: KeystoreBackendInfo;
  busy: boolean;
  memoryDemo: MemoryDemoResult | null;
  onRunMemoryDemo(): void;
}) {
  const backend = props.backend;
  return (
    <section className="subpanel backend-details">
      <div className="subpanel-header">
        <div>
          <h2>{backend.name} keystore</h2>
          <p>{backend.signer}</p>
        </div>
        <span className={`backend-status ${backend.status}`}>{backend.status}</span>
      </div>
      <CapabilityGrid backend={backend} />
      <div className="operation-list">
        {backend.operations.map((operation) => (
          <span key={operation}>{operation}</span>
        ))}
      </div>
      <BackendGuidance backend={backend} />
      {backend.id === 'memory' ? (
        <div className="actions secondary">
          <button
            className="primary"
            type="button"
            onClick={props.onRunMemoryDemo}
            disabled={props.busy}
          >
            Run memory keystore demo
          </button>
        </div>
      ) : null}
      {backend.id === 'memory' && props.memoryDemo ? (
        <MemoryDemoResults result={props.memoryDemo} />
      ) : null}
    </section>
  );
}

function CapabilityGrid(props: { backend: KeystoreBackendInfo }) {
  const { backend } = props;
  return (
    <div className="capability-grid">
      <Capability label="Secret" value={backend.secret} />
      <Capability label="Write" value={backend.capabilities.write ? 'yes' : 'no'} />
      <Capability label="List" value={backend.capabilities.list ? 'yes' : 'no'} />
      <Capability label="Rotate" value={backend.capabilities.rotate ? 'yes' : 'no'} />
    </div>
  );
}

function Capability(props: { label: string; value: string }) {
  return (
    <div>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function BackendGuidance(props: { backend: KeystoreBackendInfo }) {
  if (props.backend.id === 'file') {
    return (
      <p className="info-note">
        The encrypted file backend is implemented for Node runtimes because it uses filesystem
        access and `0600` writes. In this browser showcase it is represented as a managed backend
        target; use it from the backend, CLI, or a desktop shell that can prompt for a passphrase.
      </p>
    );
  }
  if (props.backend.id === 'ledger') {
    return (
      <p className="info-note">
        The Ledger controls below exercise the hardware-backed keystore path today. The provider
        lists configured opaque accounts and returns signers without exporting device secrets.
      </p>
    );
  }
  if (props.backend.status === 'planned') {
    return (
      <p className="info-note">
        Adapter contracts exist in `@cfxdevkit/wallet`; this showcase keeps a slot for the vendor
        connection flow and bridge health checks before enabling signing controls.
      </p>
    );
  }
  return null;
}

function MemoryDemoResults(props: { result: MemoryDemoResult }) {
  return (
    <dl className="results compact-results">
      <Result label="Provider" value={props.result.providerId} />
      <Result label="Listed" value={props.result.listed.join(', ')} wrap />
      <Result label="Address" value={props.result.address} wrap />
      <Result label="Signature" value={props.result.signature} wrap />
    </dl>
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
