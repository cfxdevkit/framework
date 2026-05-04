import { ConnectWall, CopyButton, errMsg, WalletPickerModal } from '@cfxdevkit/example-showcase-ui';
import { useState } from 'react';
import { type Hex, verifyMessage, verifyTypedData } from 'viem';
import { useAccount, useSignMessage, useSignTypedData } from 'wagmi';

const EIP712_DOMAIN = {
  name: 'cfxdevkit-showcase-browser',
  version: '1',
  chainId: 1030,
} as const;

const EIP712_TYPES = {
  Greeting: [
    { name: 'from', type: 'address' },
    { name: 'message', type: 'string' },
    { name: 'issuedAt', type: 'uint256' },
  ],
} as const;

export function ESpaceSection() {
  const { address, isConnected, chainId } = useAccount();
  const [pickerOpen, setPickerOpen] = useState(false);
  const walletStatus = isConnected ? 'active' : 'not-active';
  const [pmMsg, setPmMsg] = useState('hello cfxdevkit');
  const [pmResult, setPmResult] = useState<{ sig: Hex; verified: boolean } | null>(null);
  const [pmErr, setPmErr] = useState<string | null>(null);
  const { signMessageAsync, isPending: pmPending } = useSignMessage();
  const [tdGreeting, setTdGreeting] = useState('gm conflux');
  const [tdIssuedAt] = useState(() => Date.now());
  const [tdResult, setTdResult] = useState<{ sig: Hex; verified: boolean } | null>(null);
  const [tdErr, setTdErr] = useState<string | null>(null);
  const { signTypedDataAsync, isPending: tdPending } = useSignTypedData();

  const doPersonalSign = async () => {
    if (!address) return;
    setPmErr(null);
    setPmResult(null);
    try {
      const sig = await signMessageAsync({ message: pmMsg });
      const verified = await verifyMessage({ address, message: pmMsg, signature: sig });
      setPmResult({ sig, verified });
    } catch (e) {
      setPmErr(errMsg(e));
    }
  };

  const doTypedSign = async () => {
    if (!address) return;
    setTdErr(null);
    setTdResult(null);
    const typedMsg = { from: address, message: tdGreeting, issuedAt: BigInt(tdIssuedAt) };
    const domain = { ...EIP712_DOMAIN, chainId: chainId ?? EIP712_DOMAIN.chainId };
    try {
      const sig = await signTypedDataAsync({
        domain,
        types: EIP712_TYPES,
        primaryType: 'Greeting',
        message: typedMsg,
      });
      const verified = await verifyTypedData({
        address,
        domain,
        types: EIP712_TYPES,
        primaryType: 'Greeting',
        message: typedMsg,
        signature: sig,
      });
      setTdResult({ sig, verified });
    } catch (e) {
      setTdErr(errMsg(e));
    }
  };

  return (
    <div className="dual-col">
      <div className="dual-col-title">
        <span className="space-badge space-espace">eSpace</span>eSpace signing
      </div>
      <ConnectWall
        title="eSpace"
        status={walletStatus}
        walletName="an eSpace wallet"
        onConnect={() => setPickerOpen(true)}
      >
        <div className="sub-section">
          <h3 style={{ fontSize: 13, margin: '0 0 6px' }}>personal_sign · EIP-191</h3>
          <label>
            message
            <input value={pmMsg} onChange={(e) => setPmMsg(e.target.value)} />
          </label>
          <div className="row" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="primary"
              disabled={pmPending}
              onClick={() => void doPersonalSign()}
            >
              {pmPending ? 'Awaiting wallet…' : 'Sign'}
            </button>
          </div>
          {pmErr && <div style={{ color: 'var(--err)', fontSize: 12 }}>{pmErr}</div>}
          {pmResult && <SignResult sig={pmResult.sig} verified={pmResult.verified} />}
        </div>
        <div className="sub-section" style={{ marginTop: 14 }}>
          <h3 style={{ fontSize: 13, margin: '0 0 6px' }}>signTypedData · EIP-712</h3>
          <label>
            greeting
            <input value={tdGreeting} onChange={(e) => setTdGreeting(e.target.value)} />
          </label>
          <div className="row" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="primary"
              disabled={tdPending}
              onClick={() => void doTypedSign()}
            >
              {tdPending ? 'Awaiting wallet…' : 'Sign typed data'}
            </button>
          </div>
          {tdErr && <div style={{ color: 'var(--err)', fontSize: 12 }}>{tdErr}</div>}
          {tdResult && <SignResult sig={tdResult.sig} verified={tdResult.verified} />}
        </div>
      </ConnectWall>
      <WalletPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}

function SignResult({ sig, verified }: { sig: Hex; verified: boolean }) {
  return (
    <div className="result">
      sig : {sig}
      {'\n'}verified : {verified ? '✓ matches account' : '✗ MISMATCH'}
      <CopyButton text={sig} />
    </div>
  );
}
