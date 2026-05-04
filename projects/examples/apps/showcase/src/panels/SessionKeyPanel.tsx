import { useEffect, useState } from 'react';
import { CopyButton } from '../components/CopyButton.js';
import { useWallet } from '../contexts/WalletProvider.js';
import { type ApiError, api } from '../lib/api.js';
import { type CapabilityInput, CHAIN_OPTIONS, type IssuedKey } from './session-key-model.js';

export function SessionKeyPanel() {
  const w = useWallet();
  const [chainSel, setChainSel] = useState<number>(1030);
  const [contracts, setContracts] = useState('');
  const [selectors, setSelectors] = useState('0xa9059cbb');
  const [maxValue, setMaxValue] = useState('1000000000000000000');
  const [ttlMinutes, setTtlMinutes] = useState(60);
  const [issued, setIssued] = useState<IssuedKey | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; message: string } | null>(
    null,
  );
  const [busy, setBusy] = useState<'idle' | 'issuing' | 'verifying'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then(() => !cancelled && setBackendOk(true))
      .catch(() => !cancelled && setBackendOk(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const buildCapability = (): CapabilityInput => ({
    chains: [chainSel],
    contracts: contracts
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.startsWith('0x') && s.length === 42),
    selectors: selectors
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.startsWith('0x') && s.length === 10),
    maxValuePerTx: maxValue.trim(),
    notAfterMs: Date.now() + ttlMinutes * 60_000,
  });

  const issue = async () => {
    if (!w.active) {
      setError('Connect a wallet account first');
      return;
    }
    setError(null);
    setIssued(null);
    setVerifyResult(null);
    const capability = buildCapability();
    try {
      setBusy('issuing');
      const out = await api.sessionKeyIssue({
        parentPrivateKey: w.active.privateKey,
        capability: {
          chains: capability.chains,
          ...(capability.contracts.length > 0 ? { contracts: capability.contracts } : {}),
          ...(capability.selectors.length > 0 ? { selectors: capability.selectors } : {}),
          ...(capability.maxValuePerTx.length > 0
            ? { maxValuePerTx: capability.maxValuePerTx }
            : {}),
          notAfter: capability.notAfterMs,
        },
      });
      setIssued({ ...out, inputCapability: capability });
    } catch (e) {
      setError((e as ApiError | Error).message);
    } finally {
      setBusy('idle');
    }
  };

  const verify = async () => {
    if (!issued) return;
    setError(null);
    setVerifyResult(null);
    try {
      setBusy('verifying');
      const out = await api.sessionKeyVerify({
        parent: issued.parent,
        session: issued.session,
        capability: {
          chains: issued.inputCapability.chains,
          ...(issued.inputCapability.contracts.length > 0
            ? { contracts: issued.inputCapability.contracts }
            : {}),
          ...(issued.inputCapability.selectors.length > 0
            ? { selectors: issued.inputCapability.selectors }
            : {}),
          ...(issued.inputCapability.maxValuePerTx.length > 0
            ? { maxValuePerTx: issued.inputCapability.maxValuePerTx }
            : {}),
          notAfter: issued.inputCapability.notAfterMs,
        },
        signature: issued.attestation.signature,
      });
      setVerifyResult(out);
    } catch (e) {
      setError((e as ApiError | Error).message);
    } finally {
      setBusy('idle');
    }
  };

  return (
    <>
      <section className="panel">
        <h2>Session Key · capability-bound delegation</h2>
        <p className="panel-desc">
          Wraps <code className="mono">createSessionKey()</code> from{' '}
          <code className="mono">@cfxdevkit/wallet/session-key</code>. The parent signs an
          attestation over <code className="mono">(session, capability)</code>; the session signer
          rejects out-of-bounds calls at sign time. Backend at{' '}
          <code className="mono">{api.baseUrl}</code>{' '}
          {backendOk === null ? (
            <span className="muted">probing…</span>
          ) : backendOk ? (
            <span style={{ color: 'var(--accent-2)' }}>healthy</span>
          ) : (
            <span style={{ color: 'var(--err)' }}>unreachable</span>
          )}
        </p>

        <div className="row">
          <label>
            chain
            <select value={chainSel} onChange={(e) => setChainSel(Number(e.target.value))}>
              {CHAIN_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            ttl (minutes)
            <input
              type="number"
              min={1}
              max={1440}
              value={ttlMinutes}
              onChange={(e) =>
                setTtlMinutes(Math.max(1, Math.min(1440, Number(e.target.value) || 1)))
              }
              style={{ width: 100 }}
            />
          </label>
          <label style={{ flex: 1, minWidth: 240 }}>
            maxValuePerTx (wei)
            <input value={maxValue} onChange={(e) => setMaxValue(e.target.value)} />
          </label>
        </div>

        <label style={{ marginTop: 12 }}>
          contracts (whitespace/comma-separated 0x… addresses)
          <textarea
            rows={2}
            value={contracts}
            onChange={(e) => setContracts(e.target.value)}
            placeholder="0xabcdef0123456789abcdef0123456789abcdef01"
          />
        </label>
        <label>
          selectors (4-byte function selectors)
          <input value={selectors} onChange={(e) => setSelectors(e.target.value)} />
        </label>

        <div className="row" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="primary"
            onClick={issue}
            disabled={!w.active || busy !== 'idle'}
          >
            {busy === 'issuing' ? 'Issuing…' : 'Issue session key'}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={verify}
            disabled={!issued || busy !== 'idle'}
          >
            {busy === 'verifying' ? 'Verifying…' : 'Verify attestation'}
          </button>
        </div>

        {!w.active && (
          <p className="muted" style={{ marginTop: 8 }}>
            Connect an account in the Wallet tab first.
          </p>
        )}
        {error && (
          <div className="result" style={{ color: 'var(--err)' }}>
            {error}
          </div>
        )}
      </section>

      {issued && (
        <section className="panel">
          <h2>Issued session key</h2>
          <div className="account-card">
            <div className="row-line">
              <span className="label">parent</span>
              <span>{issued.parent}</span>
              <CopyButton text={issued.parent} />
            </div>
            <div className="row-line">
              <span className="label">session</span>
              <span>{issued.session}</span>
              <CopyButton text={issued.session} />
            </div>
          </div>
          <h2 style={{ marginTop: 16 }}>Capability (canonical)</h2>
          <pre className="result">{JSON.stringify(issued.capability, null, 2)}</pre>
          <h2 style={{ marginTop: 16 }}>Attestation</h2>
          <div className="result">
            digest : {issued.attestation.digest}
            {'\n'}signature : {issued.attestation.signature}
            {'\n\n'}message :{'\n'}
            {issued.attestation.message}
          </div>
          {verifyResult && (
            <>
              <h2 style={{ marginTop: 16 }}>Verification</h2>
              <div
                className="result"
                style={{ color: verifyResult.valid ? 'var(--accent-2)' : 'var(--err)' }}
              >
                valid: {String(verifyResult.valid)}
                {'\n'}reconstructed message matches:{' '}
                {String(verifyResult.message === issued.attestation.message)}
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
