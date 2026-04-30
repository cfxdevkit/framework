/**
 * WagmiConnectPanel — connector catalogue for the wagmi side of the
 * stack. Lists every connector configured in `WagmiProviders` and
 * lets the user invoke each one. The header pill uses the same wagmi
 * state — connecting here will reflect there immediately.
 *
 * For Conflux usage: wagmi only covers eSpace (`eth_*` RPC). For
 * Core space, see the Fluent panel.
 */

import { LogBox, useLogList } from '@cfxdevkit/example-showcase-ui';
import { useEffect } from 'react';
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from 'wagmi';

export function WagmiConnectPanel() {
  const { address, isConnected, status, connector } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { chains, switchChain, isPending: switching } = useSwitchChain();
  const { entries, log, clear } = useLogList();

  useEffect(() => {
    log(`wagmi status → ${status}${connector ? ` via ${connector.name}` : ''}`);
  }, [status, connector, log]);
  useEffect(() => {
    if (address) log(`account → ${address}`);
  }, [address, log]);
  useEffect(() => {
    log(`chainId → ${chainId}`);
  }, [chainId, log]);
  useEffect(() => {
    if (error) log(`connect error: ${error.message}`, 'error');
  }, [error, log]);

  return (
    <>
      <section className="panel">
        <h2>wagmi · connectors</h2>
        <p className="panel-desc">
          Lists every connector in the wagmi config. <code className="mono">injected()</code>{' '}
          delegates to the first non-Fluent EIP-1193 provider from{' '}
          <code className="mono">window.ethereum</code> / <code className="mono">providers[]</code>{' '}
          (MetaMask, OKX, Brave, Frame…).
        </p>

        <div className="result">
          status : {status}
          {'\n'}address : {address ?? 'null'}
          {'\n'}chainId : {chainId}
          {'\n'}connector : {connector?.name ?? 'none'}
        </div>

        <div className="row" style={{ marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
          {connectors.map((c) => (
            <button
              key={c.uid}
              type="button"
              className="primary"
              disabled={isPending || isConnected}
              onClick={() => connect({ connector: c })}
            >
              Connect via {c.name}
            </button>
          ))}
          {isConnected && (
            <button type="button" className="secondary" onClick={() => disconnect()}>
              Disconnect
            </button>
          )}
        </div>

        {error && (
          <div className="result" style={{ color: 'var(--err)' }}>
            {error.message}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Switch chain</h2>
        <p className="panel-desc">
          Sends <code className="mono">wallet_switchEthereumChain</code> to the connected wallet. If
          the chain isn't in the wallet's catalogue you'll get a 4902 — wallets handle that by
          prompting <code className="mono">wallet_addEthereumChain</code>.
        </p>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {chains.map((c) => (
            <button
              key={c.id}
              type="button"
              className={c.id === chainId ? 'primary' : 'secondary'}
              disabled={!isConnected || switching || c.id === chainId}
              onClick={() => switchChain({ chainId: c.id })}
            >
              {c.name} ({c.id})
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Events</h2>
        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="secondary" onClick={clear}>
            Clear log
          </button>
        </div>
        <div style={{ marginTop: 8 }}>
          <LogBox entries={entries} />
        </div>
      </section>
    </>
  );
}
