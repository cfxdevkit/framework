import { errMsg } from '@cfxdevkit/example-showcase-ui';
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import {
  type Capability,
  type IssueResult,
  parseCapability,
  type VerifyResult,
} from './session-key-model.js';
import { SessionKeyResults } from './session-key-results.js';

export function SessionKeyPanel() {
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [parentPrivateKey, setParentPrivateKey] = useState('');
  const [cap, setCap] = useState<Capability>({
    chains: '',
    contracts: '',
    selectors: '',
    maxValuePerTx: '',
    ttlSeconds: '3600',
  });
  const [issueResult, setIssueResult] = useState<IssueResult | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [busy, setBusy] = useState<'issue' | 'verify' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then(() => {
        if (!cancelled) setBackendOk(true);
      })
      .catch(() => {
        if (!cancelled) setBackendOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const doIssue = async () => {
    const trimmedKey = parentPrivateKey.trim();
    if (!trimmedKey) {
      setError('Enter a parent private key');
      return;
    }
    setError(null);
    setIssueResult(null);
    setVerifyResult(null);
    setBusy('issue');
    try {
      const capability = parseCapability(cap);
      setIssueResult(await api.sessionKeyIssue({ parentPrivateKey: trimmedKey, capability }));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const doVerify = async () => {
    if (!issueResult) return;
    setError(null);
    setVerifyResult(null);
    setBusy('verify');
    try {
      // Reuse the capability exactly as issued — do NOT recompute notAfter here,
      // since the backend verifies the signature against the original capability
      // and a freshly-computed notAfter would produce a different message hash.
      const capability = issueResult.capability as Parameters<
        typeof api.sessionKeyVerify
      >[0]['capability'];
      setVerifyResult(
        await api.sessionKeyVerify({
          parent: issueResult.parent,
          session: issueResult.session,
          capability,
          signature: issueResult.attestation.signature,
        }),
      );
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const setCap2 = (k: keyof Capability) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCap((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      {/* Backend health */}
      <div className="row" style={{ marginBottom: 16 }}>
        <span
          className="dot"
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background:
              backendOk === null ? 'var(--muted)' : backendOk ? 'var(--accent-2)' : 'var(--err)',
          }}
        />
        <span className="muted" style={{ fontSize: 12 }}>
          backend: {backendOk === null ? '…' : backendOk ? 'online' : 'offline'}
        </span>
      </div>

      <div className="warning">
        Copy a private key from the <strong>DevNode genesis accounts</strong> (DevNode Control
        panel) and paste it below. The server issues a session key attested against it.
      </div>

      {/* Parent private key */}
      <label style={{ marginBottom: 16 }}>
        Parent private key (0x…)
        <input
          type="password"
          value={parentPrivateKey}
          onChange={(e) => setParentPrivateKey(e.target.value)}
          placeholder="0x..."
          style={{ fontFamily: 'var(--mono)', fontSize: 12 }}
        />
      </label>

      {/* Capability form */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600 }}>
          Capability constraints
        </h3>
        <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
          Leave blank to allow all. Comma-separated lists for chains / contracts / selectors.
        </p>
        <div className="row" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
          <label>
            Allowed chains (chain IDs)
            <input value={cap.chains} onChange={setCap2('chains')} placeholder="1030,71" />
          </label>
          <label>
            Allowed contracts
            <input value={cap.contracts} onChange={setCap2('contracts')} placeholder="0x…,0x…" />
          </label>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <label>
            Allowed selectors (4-byte hex)
            <input value={cap.selectors} onChange={setCap2('selectors')} placeholder="0xa9059cbb" />
          </label>
          <label>
            Max value per tx (wei)
            <input
              value={cap.maxValuePerTx}
              onChange={setCap2('maxValuePerTx')}
              placeholder="1000000000000000000"
            />
          </label>
          <label>
            TTL (seconds)
            <input
              type="number"
              value={cap.ttlSeconds}
              onChange={setCap2('ttlSeconds')}
              style={{ width: 100 }}
            />
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="row" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className="primary"
          disabled={!!busy || !parentPrivateKey.trim()}
          onClick={() => void doIssue()}
        >
          {busy === 'issue' ? 'Issuing…' : 'Issue session key'}
        </button>
        {issueResult && (
          <button
            type="button"
            className="secondary"
            disabled={!!busy}
            onClick={() => void doVerify()}
          >
            {busy === 'verify' ? 'Verifying…' : 'Verify attestation'}
          </button>
        )}
      </div>

      <SessionKeyResults issueResult={issueResult} verifyResult={verifyResult} error={error} />
    </div>
  );
}
