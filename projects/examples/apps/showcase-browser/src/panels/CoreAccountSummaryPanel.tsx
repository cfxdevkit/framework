/**
 * CoreAccountSummaryPanel — read-only dashboard for the connected
 * Conflux **Core space** account via Fluent's `window.conflux` provider.
 *
 * Mirrors the eSpace `AccountSummaryPanel` (which uses wagmi) but for the
 * `cfx_*` JSON-RPC dialect. Calls go directly through `window.conflux`:
 *
 *   - `cfx_getBalance` — drip balance.
 *   - `cfx_epochNumber` — head epoch (Core's analogue of block height).
 *   - `cfx_gasPrice`    — current network gas price (drip).
 *
 * No signing performed here — pure RPC.
 */
import { formatCFX, formatGDrip } from '@cfxdevkit/core';
import { CopyButton, errMsg } from '@cfxdevkit/example-showcase-ui';
import { useCallback, useEffect, useState } from 'react';
import { getFluentProvider, useCoreWallet } from '../lib/use-core-wallet.js';

export function CoreAccountSummaryPanel() {
  const { status, address: account, chainId, isConnected } = useCoreWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [epoch, setEpoch] = useState<string | null>(null);
  const [gasPrice, setGasPrice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !account) {
      setBalance(null);
      return;
    }
    const provider = getFluentProvider();
    if (!provider) return;
    const fetchBalance = async () => {
      try {
        const nextBalance = (await provider.request({
          method: 'cfx_getBalance',
          params: [account, 'latest_state'],
        })) as string;
        setBalance(nextBalance);
      } catch {
        // ignore transient polling errors
      }
    };
    void fetchBalance();
    const timer = setInterval(() => void fetchBalance(), 8_000);
    return () => clearInterval(timer);
  }, [account, isConnected]);

  const refreshChainState = useCallback(async () => {
    const provider = getFluentProvider();
    if (!provider) return;
    setError(null);
    try {
      const [head, gas] = await Promise.all([
        provider.request({ method: 'cfx_epochNumber' }) as Promise<string>,
        provider.request({ method: 'cfx_gasPrice' }) as Promise<string>,
      ]);
      setEpoch(BigInt(head).toString());
      setGasPrice(BigInt(gas).toString());
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    void refreshChainState();
    const t = setInterval(() => void refreshChainState(), 6_000);
    return () => clearInterval(t);
  }, [isConnected, refreshChainState]);

  if (!isConnected || !account) {
    return (
      <section className="panel">
        <h2>Core account summary</h2>
        <p className="panel-desc">
          Connect Fluent's Core-space provider via the <strong>Conflux Core · Fluent</strong> panel
          first.
        </p>
        <div className="result">status: {status ?? 'undefined'}</div>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Core account summary</h2>
      <p className="panel-desc">
        Pure read RPC against the active Core chain — balance via{' '}
        <code className="mono">cfx_getBalance</code>, head via{' '}
        <code className="mono">cfx_epochNumber</code>, gas via{' '}
        <code className="mono">cfx_gasPrice</code>. No signing.
      </p>

      <div className="result">
        address : {account} <CopyButton text={account} />
        {'\n'}chainId : {chainId ?? 'unknown'}
        {'\n'}balance : {balance ? `${formatCFX(BigInt(balance))} CFX` : '…'}
        {'\n'}epoch : {epoch ?? '…'}
        {'\n'}gasPrice :{' '}
        {gasPrice ? `${formatGDrip(BigInt(gasPrice))} Gdrip (${gasPrice} drip)` : '…'}
      </div>

      {error && (
        <div className="result" style={{ color: 'var(--err)' }}>
          {error}
        </div>
      )}

      <div className="row" style={{ marginTop: 12, gap: 8 }}>
        <button type="button" className="secondary" onClick={() => void refreshChainState()}>
          Refresh epoch / gas
        </button>
      </div>
    </section>
  );
}
