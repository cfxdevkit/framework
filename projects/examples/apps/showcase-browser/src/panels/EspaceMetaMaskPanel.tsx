/**
 * EspaceMetaMaskPanel — Conflux **eSpace** via MetaMask (or any
 * `window.ethereum` provider that flags `isMetaMask=true`). Uses
 * `@cfxjs/use-wallet-react/ethereum/MetaMask`.
 *
 * For arbitrary EIP-1193 providers (Brave, Frame, Rabby, OKX) prefer
 * the wagmi `injected()` panel — it goes through wagmi's connector
 * lifecycle and gets you balance / chain switching for free.
 */

import { errMsg, LogBox, useLogList } from '@cfxdevkit/example-showcase-ui';
import {
  connect as mmConnect,
  provider as mmProvider,
  useAccount as useMMAccount,
  useChainId as useMMChainId,
  useStatus as useMMStatus,
} from '@cfxjs/use-wallet-react/ethereum/MetaMask';
import { useEffect, useState } from 'react';

export function EspaceMetaMaskPanel() {
  const status = useMMStatus();
  const account = useMMAccount();
  const chainId = useMMChainId();
  const { entries, log, clear } = useLogList();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    log(`status → ${status ?? 'undefined'}`);
  }, [status, log]);
  useEffect(() => {
    if (account !== undefined) log(`account → ${account ?? 'null'}`);
  }, [account, log]);
  useEffect(() => {
    if (chainId !== undefined) log(`chainId → ${chainId ?? 'null'}`);
  }, [chainId, log]);

  const doConnect = async () => {
    if (status !== 'not-active') {
      log(`connect() skipped — status=${status}`, 'warn');
      return;
    }
    setError(null);
    log('connect() called');
    try {
      await mmConnect();
      log('connect() resolved ✓');
    } catch (e) {
      const m = errMsg(e);
      setError(m);
      log(`connect() error: ${m}`, 'error');
    }
  };

  const addEspaceTestnet = async () => {
    const eth = (window as unknown as { ethereum?: { request: (a: unknown) => Promise<unknown> } })
      .ethereum;
    if (!eth) {
      log('window.ethereum not present', 'error');
      return;
    }
    log('wallet_addEthereumChain(eSpace testnet)…');
    try {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x47', // 71
            chainName: 'Conflux eSpace (Testnet)',
            nativeCurrency: { name: 'CFX', symbol: 'CFX', decimals: 18 },
            rpcUrls: ['https://evmtestnet.confluxrpc.com'],
            blockExplorerUrls: ['https://evmtestnet.confluxscan.org'],
          },
        ],
      });
      log('wallet_addEthereumChain ✓');
    } catch (e) {
      log(`add error: ${errMsg(e)}`, 'error');
    }
  };

  const isLoading = status === 'in-detecting' || status === 'in-activating';
  const connectLabel =
    status === 'in-detecting'
      ? 'Detecting…'
      : status === 'in-activating'
        ? 'Connecting…'
        : status === 'active'
          ? '✓ Connected'
          : status === 'not-installed'
            ? 'MetaMask not installed'
            : 'Connect MetaMask';

  return (
    <section className="panel">
      <h2>Conflux eSpace · MetaMask</h2>
      <p className="panel-desc">
        <code className="mono">@cfxjs/use-wallet-react/ethereum/MetaMask</code> — detects{' '}
        <code className="mono">window.ethereum</code> with{' '}
        <code className="mono">isMetaMask=true</code>. Same EIP-1193 surface that wagmi uses; this
        panel just exposes the raw status/connect lifecycle for debugging.
      </p>

      <div className="row" style={{ gap: 12, marginTop: 8 }}>
        <span className="muted">status:</span>
        <span className="mono">{status ?? 'undefined'}</span>
        <span className="muted">provider:</span>
        <span className="mono">{mmProvider ? 'present' : 'null'}</span>
      </div>
      <div className="result">
        account : {account ?? 'null'}
        {'\n'}chainId : {chainId ?? 'null'}
      </div>

      {error && (
        <div className="result" style={{ color: 'var(--err)' }}>
          {error}
        </div>
      )}

      <div className="row" style={{ marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="primary"
          onClick={doConnect}
          disabled={isLoading || status === 'active' || status === 'not-installed'}
        >
          {connectLabel}
        </button>
        <button type="button" className="secondary" onClick={addEspaceTestnet}>
          Add eSpace testnet
        </button>
        <button type="button" className="secondary" onClick={clear}>
          Clear log
        </button>
      </div>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Events</h3>
      <LogBox entries={entries} />
    </section>
  );
}
