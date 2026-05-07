/**
 * CoreSignMessagePanel — Conflux Core space message signing via Fluent.
 *
 * Two flows, both invoked through Fluent's direct Core provider:
 *
 *   1. **personal_sign** — `personalSign(message)` ⇒ wraps Core's
 *      `personal_sign` RPC. Returns a hex signature over the EIP-191
 *      preamble + UTF-8 message bytes. Same wire format as Ethereum's
 *      personal_sign — only the address shown to the user is base32.
 *
 *   2. **CIP-23 typed data** — `typedSign({ domain, types, primaryType,
 *      message })` ⇒ Core's analogue of EIP-712. Note the `CIP23Domain`
 *      type instead of `EIP712Domain`. Domain `chainId` MUST be the
 *      decimal Core chain id (e.g. 1029, 1, 8888).
 *
 * No verification path here — Core verification needs a Core public-key
 * recovery routine (different from secp256k1 + keccak chain id 27/28
 * tagging used on EVM); we surface the raw signature for the caller.
 */

import { CopyButton, errMsg } from '@cfxdevkit/example-showcase-ui';
import { useMemo, useState } from 'react';
import { fromHex } from 'viem';
import { getFluentProvider, useCoreWallet } from '../lib/use-core-wallet.js';

export function CoreSignMessagePanel() {
  const { status, address: account, chainId, isConnected } = useCoreWallet();

  const [message, setMessage] = useState('Hello from Conflux Core showcase!');
  const [personalSig, setPersonalSig] = useState<string | null>(null);
  const [personalErr, setPersonalErr] = useState<string | null>(null);
  const [personalBusy, setPersonalBusy] = useState(false);

  // Decimal chain id for the typed-data domain. Core's chainId hex like
  // "0x405" → 1029.
  const numericChainId = useMemo(() => {
    if (!chainId) return 0;
    return fromHex(chainId as `0x${string}`, 'number');
  }, [chainId]);

  const typedSample = useMemo(
    () =>
      JSON.stringify(
        {
          domain: {
            name: 'cfxdevkit-showcase-browser',
            version: '1',
            chainId: numericChainId,
          },
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
      ),
    [account, numericChainId],
  );

  const [typedJson, setTypedJson] = useState<string>(typedSample);
  const [typedSig, setTypedSig] = useState<string | null>(null);
  const [typedErr, setTypedErr] = useState<string | null>(null);
  const [typedBusy, setTypedBusy] = useState(false);

  if (!isConnected || !account) {
    return (
      <section className="panel">
        <h2>Core sign message</h2>
        <p className="panel-desc">
          Connect via the <strong>Conflux Core · Fluent</strong> panel first.
        </p>
        <div className="result">status: {status ?? 'undefined'}</div>
      </section>
    );
  }

  const doPersonalSign = async () => {
    setPersonalErr(null);
    setPersonalSig(null);
    setPersonalBusy(true);
    const provider = getFluentProvider();
    if (!provider) {
      setPersonalErr('Fluent Core provider not found');
      setPersonalBusy(false);
      return;
    }
    try {
      const sig = (await provider.request({
        method: 'personal_sign',
        params: [message, account],
      })) as string;
      setPersonalSig(sig);
    } catch (e) {
      setPersonalErr(errMsg(e));
    } finally {
      setPersonalBusy(false);
    }
  };

  const doTypedSign = async () => {
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
      const parsed = JSON.parse(typedJson);
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
    <section className="panel">
      <h2>Core sign message</h2>
      <p className="panel-desc">
        Wraps <code className="mono">personal_sign</code> and{' '}
        <code className="mono">cfx_signTypedData_v4</code> exposed by Fluent's Core provider.
        Address is base32 (CIP-37); the signed payload itself is the same UTF-8 / CIP-23 bytes the
        wallet shows in its prompt.
      </p>

      <h3 style={{ fontSize: 13, marginTop: 12 }}>personal_sign</h3>
      <textarea
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{
          width: '100%',
          background: 'var(--panel-2)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: 8,
          fontFamily: 'var(--mono)',
          fontSize: 12,
        }}
      />
      <div className="row" style={{ gap: 8, marginTop: 8 }}>
        <button type="button" className="primary" disabled={personalBusy} onClick={doPersonalSign}>
          {personalBusy ? 'Signing…' : 'personalSign(message)'}
        </button>
      </div>
      {personalErr && (
        <div className="result" style={{ color: 'var(--err)' }}>
          {personalErr}
        </div>
      )}
      {personalSig && (
        <div className="result">
          signer : {account} <CopyButton text={account} />
          {'\n'}signature : {personalSig} <CopyButton text={personalSig} />
        </div>
      )}

      <h3 style={{ fontSize: 13, marginTop: 16 }}>typedSign (CIP-23)</h3>
      <textarea
        rows={14}
        value={typedJson}
        onChange={(e) => setTypedJson(e.target.value)}
        spellCheck={false}
        style={{
          width: '100%',
          background: 'var(--panel-2)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: 8,
          fontFamily: 'var(--mono)',
          fontSize: 12,
        }}
      />
      <div className="row" style={{ gap: 8, marginTop: 8 }}>
        <button type="button" className="primary" disabled={typedBusy} onClick={doTypedSign}>
          {typedBusy ? 'Signing…' : 'typedSign(payload)'}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => setTypedJson(typedSample)}
          disabled={typedBusy}
        >
          Reset to sample
        </button>
      </div>
      {typedErr && (
        <div className="result" style={{ color: 'var(--err)' }}>
          {typedErr}
        </div>
      )}
      {typedSig && (
        <div className="result">
          signer : {account} <CopyButton text={account} />
          {'\n'}signature : {typedSig} <CopyButton text={typedSig} />
        </div>
      )}
    </section>
  );
}
