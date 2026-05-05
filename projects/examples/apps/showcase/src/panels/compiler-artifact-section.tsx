import type { Abi } from 'viem';
import type { CompileTemplateResponse } from '../lib/api.js';

export interface CompilerArtifactSectionProps {
  artifact: CompileTemplateResponse | null;
  deploying: boolean;
  signer: unknown;
  chain: { name: string; family: 'core' | 'espace' };
  isCore: boolean;
  accountsLength: number;
  activeIndex: number | null;
  connect: (index: number) => void;
  deploy: () => void;
  deployErr: string | null;
  deployedHash: string | null;
}

export function CompilerArtifactSection({
  artifact,
  deploying,
  signer,
  chain,
  isCore,
  accountsLength,
  activeIndex,
  connect,
  deploy,
  deployErr,
  deployedHash,
}: CompilerArtifactSectionProps) {
  if (!artifact) return null;
  return (
    <div className="card" style={{ marginTop: 16, border: '1px solid var(--accent)' }}>
      <h3 style={{ marginTop: 0, fontSize: 14, color: 'var(--accent)' }}>
        3. Deploy <span className="muted">({artifact.contractName})</span>
        {artifact.cached && (
          <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>
            cached
          </span>
        )}
      </h3>
      <dl className="kv">
        <dt>inputHash</dt>
        <dd className="mono" style={{ fontSize: 11, wordBreak: 'break-all' }}>
          {artifact.inputHash}
        </dd>
        <dt>bytecode</dt>
        <dd className="mono" style={{ fontSize: 11 }}>
          {artifact.bytecode.length} chars
        </dd>
        <dt>abi entries</dt>
        <dd>{(artifact.abi as Abi).length}</dd>
        <dt>warnings</dt>
        <dd>{artifact.warnings.length}</dd>
      </dl>
      <div className="row" style={{ gap: 8, marginTop: 16 }}>
        <button
          type="button"
          className="primary"
          style={{ width: '100%', padding: '12px 0', fontSize: 16 }}
          onClick={deploy}
          disabled={deploying || !signer}
        >
          {deploying ? 'Deploying…' : `Deploy to ${chain.name} (${isCore ? 'Core' : 'eSpace'})`}
        </button>
      </div>
      {!signer && (
        <WalletHint accountsLength={accountsLength} activeIndex={activeIndex} connect={connect} />
      )}
      {deployErr && <p className="error">{deployErr}</p>}
      {deployedHash && (
        <div className="result" style={{ marginTop: 12 }}>
          <div>
            <strong>tx submitted:</strong>{' '}
            <code className="mono" style={{ fontSize: 11 }}>
              {deployedHash}
            </code>
          </div>
          <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
            Address (when receipt available) is recorded in the deploy log below.
          </p>
        </div>
      )}
    </div>
  );
}

function WalletHint({
  accountsLength,
  activeIndex,
  connect,
}: {
  accountsLength: number;
  activeIndex: number | null;
  connect: (index: number) => void;
}) {
  return (
    <p className="muted" style={{ marginTop: 8 }}>
      No wallet connected.{' '}
      {accountsLength > 0 ? (
        <button
          type="button"
          className="link"
          onClick={() => connect(0)}
          style={{
            background: 'none',
            border: 0,
            padding: 0,
            color: 'var(--accent-1)',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          Connect account [0]
        </button>
      ) : (
        <span>Open the Wallet tab to derive accounts from the active mnemonic.</span>
      )}{' '}
      to enable deploy.
      {activeIndex !== null && ` (Active index: ${activeIndex})`}
    </p>
  );
}
