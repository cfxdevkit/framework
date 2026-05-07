import { ConnectWall, CopyButton, errMsg } from '@cfxdevkit/example-showcase-ui';
import { useMemo, useState } from 'react';
import { fromHex } from 'viem';
import { getFluentProvider, useCoreWallet } from '../lib/use-core-wallet.js';

export function CoreSection() {
  const { status, address: account, chainId, isDetecting, isConnecting, connect } = useCoreWallet();
  const [connecting, setConnecting] = useState(false);
  const [connectErr, setConnectErr] = useState<string | null>(null);
  const [pmMsg, setPmMsg] = useState('Hello from Conflux Core!');
  const [pmSig, setPmSig] = useState<string | null>(null);
  const [pmErr, setPmErr] = useState<string | null>(null);
  const [pmBusy, setPmBusy] = useState(false);
  const numericChainId = useMemo(
    () => (chainId ? fromHex(chainId as `0x${string}`, 'number') : 0),
    [chainId],
  );
  const cip23Template = useMemo(
    () => buildCip23Template(account, numericChainId),
    [account, numericChainId],
  );
  const [typedJson, setTypedJson] = useState('');
  const [typedSig, setTypedSig] = useState<string | null>(null);
  const [typedErr, setTypedErr] = useState<string | null>(null);
  const [typedBusy, setTypedBusy] = useState(false);
  const effectiveTypedJson = typedJson || cip23Template;

  const doConnect = async () => {
    setConnectErr(null);
    setConnecting(true);
    try {
      await connect();
    } catch (e) {
      setConnectErr(errMsg(e));
    } finally {
      setConnecting(false);
    }
  };

  const doPersonalSign = async () => {
    if (!account) return;
    setPmErr(null);
    setPmSig(null);
    setPmBusy(true);
    const provider = getFluentProvider();
    if (!provider) {
      setPmErr('Fluent Core provider not found');
      setPmBusy(false);
      return;
    }
    try {
      setPmSig(
        (await provider.request({ method: 'personal_sign', params: [pmMsg, account] })) as string,
      );
    } catch (e) {
      setPmErr(errMsg(e));
    } finally {
      setPmBusy(false);
    }
  };

  const doTypedSign = async () => {
    if (!account) return;
    setTypedErr(null);
    setTypedSig(null);
    setTypedBusy(true);
    const provider = getFluentProvider();
    if (!provider) {
      setTypedErr('Fluent Core provider not found');
      setTypedBusy(false);
      return;
    }
    try {
      const parsed = JSON.parse(effectiveTypedJson);
      const sig = (await provider.request({
        method: 'cfx_signTypedData_v4',
        params: [account, JSON.stringify(parsed)],
      })) as string;
      setTypedSig(sig);
    } catch (e) {
      setTypedErr(errMsg(e));
    } finally {
      setTypedBusy(false);
    }
  };

  return (
    <div className="dual-col">
      <div className="dual-col-title">
        <span className="space-badge space-core">Core</span>Core signing
      </div>
      <ConnectWall
        title="Core"
        status={status}
        walletName="Fluent Core"
        onConnect={() => void doConnect()}
        connecting={connecting || isDetecting || isConnecting}
      >
        <div className="sub-section">
          <h3 style={{ fontSize: 13, margin: '0 0 6px' }}>personal_sign</h3>
          <label>
            message
            <input value={pmMsg} onChange={(e) => setPmMsg(e.target.value)} />
          </label>
          <div className="row" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="primary"
              disabled={pmBusy}
              onClick={() => void doPersonalSign()}
            >
              {pmBusy ? 'Awaiting wallet…' : 'Sign'}
            </button>
          </div>
          {pmErr && <div style={{ color: 'var(--err)', fontSize: 12 }}>{pmErr}</div>}
          {pmSig && <SignatureResult sig={pmSig} />}
        </div>
        <div className="sub-section" style={{ marginTop: 14 }}>
          <h3 style={{ fontSize: 13, margin: '0 0 6px' }}>typedSign · CIP-23</h3>
          <p className="panel-desc" style={{ marginBottom: 6 }}>
            Edit JSON below — domain chainId must be decimal Core chain id (1029 mainnet / 1
            testnet).
          </p>
          <textarea
            rows={10}
            value={typedJson || cip23Template}
            onChange={(e) => setTypedJson(e.target.value)}
            style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 11, resize: 'vertical' }}
          />
          <div className="row" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="primary"
              disabled={typedBusy}
              onClick={() => void doTypedSign()}
            >
              {typedBusy ? 'Awaiting wallet…' : 'Sign typed data'}
            </button>
          </div>
          {typedErr && <div style={{ color: 'var(--err)', fontSize: 12 }}>{typedErr}</div>}
          {typedSig && <SignatureResult sig={typedSig} />}
        </div>
      </ConnectWall>
      {connectErr && <div style={{ color: 'var(--err)', fontSize: 12 }}>{connectErr}</div>}
    </div>
  );
}

function SignatureResult({ sig }: { sig: string }) {
  return (
    <div className="result">
      sig: {sig}
      <CopyButton text={sig} />
    </div>
  );
}

function buildCip23Template(account: string | null, numericChainId: number) {
  return JSON.stringify(
    {
      domain: { name: 'cfxdevkit-showcase-browser', version: '1', chainId: numericChainId },
      primaryType: 'Greeting',
      types: {
        CIP23Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
        ],
        Greeting: [
          { name: 'from', type: 'string' },
          { name: 'message', type: 'string' },
          { name: 'issuedAt', type: 'uint256' },
        ],
      },
      message: {
        from: account ?? '',
        message: 'Hello CIP-23',
        issuedAt: Math.floor(Date.now() / 1000),
      },
    },
    null,
    2,
  );
}
