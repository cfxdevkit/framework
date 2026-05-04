import { CopyButton } from '@cfxdevkit/example-showcase-ui';
import type { IssueResult, VerifyResult } from './session-key-model.js';

interface SessionKeyResultsProps {
  issueResult: IssueResult | null;
  verifyResult: VerifyResult | null;
  error: string | null;
}

export function SessionKeyResults({ issueResult, verifyResult, error }: SessionKeyResultsProps) {
  return (
    <>
      {issueResult && <IssueResultPanel issueResult={issueResult} />}
      {verifyResult && <VerifyResultPanel verifyResult={verifyResult} />}
      {error && (
        <div className="result" style={{ color: 'var(--err)' }}>
          {error}
        </div>
      )}
    </>
  );
}

function IssueResultPanel({ issueResult }: { issueResult: IssueResult }) {
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600 }}>Session key issued</h3>
      <table className="status-table">
        <tbody>
          <tr>
            <th>parent</th>
            <td>
              <span className="mono" style={{ fontSize: 11 }}>
                {issueResult.parent}
              </span>
              <CopyButton text={issueResult.parent} />
            </td>
          </tr>
          <tr>
            <th>session</th>
            <td>
              <span className="mono" style={{ fontSize: 11 }}>
                {issueResult.session}
              </span>
              <CopyButton text={issueResult.session} />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="muted" style={{ fontSize: 11, marginTop: 16, marginBottom: 4 }}>
        Attestation
      </div>
      <table className="status-table">
        <tbody>
          <tr>
            <th>digest</th>
            <td>
              <span className="mono" style={{ fontSize: 10 }}>
                {issueResult.attestation.digest}
              </span>
              <CopyButton text={issueResult.attestation.digest} />
            </td>
          </tr>
          <tr>
            <th>signature</th>
            <td>
              <span className="mono" style={{ fontSize: 10 }}>
                {issueResult.attestation.signature}
              </span>
              <CopyButton text={issueResult.attestation.signature} />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="muted" style={{ fontSize: 11, marginTop: 12, marginBottom: 4 }}>
        Canonical attestation message
      </div>
      <pre className="result" style={{ whiteSpace: 'pre-wrap', fontSize: 11 }}>
        {issueResult.attestation.message}
      </pre>
      <div className="muted" style={{ fontSize: 11, marginTop: 12, marginBottom: 4 }}>
        Capability granted
      </div>
      <pre className="result" style={{ fontSize: 11 }}>
        {JSON.stringify(issueResult.capability, null, 2)}
      </pre>
    </div>
  );
}

function VerifyResultPanel({ verifyResult }: { verifyResult: VerifyResult }) {
  return (
    <div
      className="panel"
      style={{
        marginBottom: 16,
        borderColor: verifyResult.valid ? 'var(--accent-2)' : 'var(--err)',
      }}
    >
      <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>
        Verification: {verifyResult.valid ? 'valid' : 'INVALID'}
      </h3>
      <p className="muted" style={{ margin: 0, fontSize: 12 }}>
        {verifyResult.message}
      </p>
    </div>
  );
}
