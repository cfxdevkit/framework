/**
 * SendTxPanel — submit a real eSpace transaction through the connected
 * wagmi wallet. By default sends a self-transfer of 0 CFX with empty
 * data — gas-only, the smallest possible test that exercises the full
 * sign+broadcast path.
 *
 * Watches the receipt with `useWaitForTransactionReceipt` so the user
 * sees mined / failed status in-line.
 */

import { CopyButton, errMsg } from '@cfxdevkit/example-showcase-ui';
import { useState } from 'react';
import { type Address, type Hex, isAddress, parseEther } from 'viem';
import { useAccount, useChainId, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';

export function SendTxPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [to, setTo] = useState<string>('');
  const [valueCfx, setValueCfx] = useState('0');
  const [data, setData] = useState<string>('0x');
  const [hash, setHash] = useState<Hex | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { sendTransactionAsync, isPending } = useSendTransaction();
  const { data: receipt, isLoading: waitingReceipt } = useWaitForTransactionReceipt({
    hash: hash ?? undefined,
    query: { enabled: Boolean(hash) },
  });

  if (!isConnected || !address) {
    return (
      <section className="panel">
        <h2>Send transaction</h2>
        <p className="panel-desc">Connect a wallet from the header first.</p>
      </section>
    );
  }

  const targetTo = (to.trim() || address) as Address;
  const targetData = (data.trim() || '0x') as Hex;

  const send = async () => {
    setError(null);
    setHash(null);
    if (!isAddress(targetTo)) {
      setError(`Invalid 'to' address: ${targetTo}`);
      return;
    }
    let value: bigint;
    try {
      value = parseEther(valueCfx.trim() || '0');
    } catch (e) {
      setError(`Invalid value (CFX): ${errMsg(e)}`);
      return;
    }
    try {
      const h = await sendTransactionAsync({ to: targetTo, value, data: targetData });
      setHash(h);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <section className="panel">
      <h2>Send transaction</h2>
      <p className="panel-desc">
        Builds and signs through the wagmi <code className="mono">useSendTransaction</code> hook,
        then watches the mined receipt. Default: 0 CFX self-transfer (gas-only).
      </p>

      <div className="row">
        <label style={{ flex: 1 }}>
          to (defaults to your own address)
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder={address}
            spellCheck={false}
          />
        </label>
        <label>
          value (CFX)
          <input
            value={valueCfx}
            onChange={(e) => setValueCfx(e.target.value)}
            style={{ width: 120 }}
          />
        </label>
      </div>
      <label style={{ marginTop: 12, display: 'block' }}>
        data
        <input value={data} onChange={(e) => setData(e.target.value)} spellCheck={false} />
      </label>

      <div className="row" style={{ marginTop: 12 }}>
        <button type="button" className="primary" onClick={send} disabled={isPending}>
          {isPending ? 'Awaiting wallet…' : 'Send'}
        </button>
        <span className="muted" style={{ fontSize: 12 }}>
          chainId {chainId}
        </span>
      </div>

      {error && (
        <div className="result" style={{ color: 'var(--err)' }}>
          {error}
        </div>
      )}

      {hash && (
        <div className="result">
          tx hash : {hash} <CopyButton text={hash} />
          {'\n'}status :{' '}
          {waitingReceipt
            ? 'pending — waiting for inclusion…'
            : receipt
              ? `${receipt.status} (block ${receipt.blockNumber.toString()}, gasUsed ${receipt.gasUsed.toString()})`
              : 'awaiting'}
        </div>
      )}
    </section>
  );
}
