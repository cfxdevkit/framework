/**
 * SignMessagePanel — exercises the connected wallet's signing surface
 * over both `personal_sign` (`useSignMessage`) and EIP-712 typed data
 * (`useSignTypedData`).
 *
 * The recovered address is computed in-browser via viem's
 * `verifyMessage` / `verifyTypedData` and compared against the wagmi
 * account — useful as a sanity check that the wallet returned a
 * signature for the address it claims.
 */

import { errMsg } from '@cfxdevkit/example-showcase-ui';
import { useState } from 'react';
import { type Hex, verifyMessage, verifyTypedData } from 'viem';
import { useAccount, useSignMessage, useSignTypedData } from 'wagmi';

const TYPED_DATA = {
  domain: {
    name: 'cfxdevkit-showcase-browser',
    version: '1',
    chainId: 1030,
  },
  types: {
    Greeting: [
      { name: 'from', type: 'address' },
      { name: 'message', type: 'string' },
      { name: 'issuedAt', type: 'uint256' },
    ],
  } as const,
  primaryType: 'Greeting' as const,
};

export function SignMessagePanel() {
  const { address, isConnected, chainId } = useAccount();
  const [message, setMessage] = useState('hello cfxdevkit');
  const [pmResult, setPmResult] = useState<{ sig: Hex; verified: boolean } | null>(null);
  const [pmErr, setPmErr] = useState<string | null>(null);

  const [td, setTd] = useState({ greeting: 'gm conflux', issuedAt: Date.now() });
  const [tdResult, setTdResult] = useState<{ sig: Hex; verified: boolean } | null>(null);
  const [tdErr, setTdErr] = useState<string | null>(null);

  const { signMessageAsync, isPending: pmPending } = useSignMessage();
  const { signTypedDataAsync, isPending: tdPending } = useSignTypedData();

  if (!isConnected || !address) {
    return (
      <section className="panel">
        <h2>Sign message</h2>
        <p className="panel-desc">Connect a wallet from the header first.</p>
      </section>
    );
  }

  const doPersonalSign = async () => {
    setPmErr(null);
    setPmResult(null);
    try {
      const sig = await signMessageAsync({ message });
      const verified = await verifyMessage({ address, message, signature: sig });
      setPmResult({ sig, verified });
    } catch (e) {
      setPmErr(errMsg(e));
    }
  };

  const doTypedSign = async () => {
    setTdErr(null);
    setTdResult(null);
    const message = {
      from: address,
      message: td.greeting,
      issuedAt: BigInt(td.issuedAt),
    };
    try {
      const sig = await signTypedDataAsync({
        domain: { ...TYPED_DATA.domain, chainId: chainId ?? TYPED_DATA.domain.chainId },
        types: TYPED_DATA.types,
        primaryType: TYPED_DATA.primaryType,
        message,
      });
      const verified = await verifyTypedData({
        address,
        domain: { ...TYPED_DATA.domain, chainId: chainId ?? TYPED_DATA.domain.chainId },
        types: TYPED_DATA.types,
        primaryType: TYPED_DATA.primaryType,
        message,
        signature: sig,
      });
      setTdResult({ sig, verified });
    } catch (e) {
      setTdErr(errMsg(e));
    }
  };

  return (
    <>
      <section className="panel">
        <h2>personal_sign · EIP-191</h2>
        <p className="panel-desc">
          Most basic signing flow. Wallet prompts the user with a UTF-8 string; the resulting
          signature recovers the signer's address via{' '}
          <code className="mono">viem.verifyMessage</code>.
        </p>
        <label>
          message
          <input value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" className="primary" onClick={doPersonalSign} disabled={pmPending}>
            {pmPending ? 'Awaiting wallet…' : 'Sign'}
          </button>
        </div>
        {pmErr && (
          <div className="result" style={{ color: 'var(--err)' }}>
            {pmErr}
          </div>
        )}
        {pmResult && (
          <div className="result">
            signature : {pmResult.sig}
            {'\n'}verified : {pmResult.verified ? '✓ matches active account' : '✗ MISMATCH'}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>signTypedData · EIP-712</h2>
        <p className="panel-desc">
          Structured signing — wallet renders the field names and chain id, much harder to phish. We
          verify with <code className="mono">viem.verifyTypedData</code>.
        </p>
        <div className="row">
          <label style={{ flex: 1 }}>
            greeting
            <input
              value={td.greeting}
              onChange={(e) => setTd({ ...td, greeting: e.target.value })}
            />
          </label>
          <label>
            issuedAt
            <input
              type="number"
              value={td.issuedAt}
              onChange={(e) => setTd({ ...td, issuedAt: Number(e.target.value) || Date.now() })}
              style={{ width: 180 }}
            />
          </label>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" className="primary" onClick={doTypedSign} disabled={tdPending}>
            {tdPending ? 'Awaiting wallet…' : 'Sign typed data'}
          </button>
        </div>
        {tdErr && (
          <div className="result" style={{ color: 'var(--err)' }}>
            {tdErr}
          </div>
        )}
        {tdResult && (
          <div className="result">
            signature : {tdResult.sig}
            {'\n'}verified : {tdResult.verified ? '✓ matches active account' : '✗ MISMATCH'}
          </div>
        )}
      </section>
    </>
  );
}
