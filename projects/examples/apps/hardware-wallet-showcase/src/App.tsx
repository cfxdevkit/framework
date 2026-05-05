import { useWalletController } from './wallet-controller.js';
import {
  BalancePanel,
  DeployPanel,
  DevNodePanel,
  Field,
  Results,
  TransferPanel,
  TxFields,
} from './wallet-ui.js';

export function App() {
  const wallet = useWalletController();

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Hardware wallet showcase</h1>
          <p>Ledger wallet testing for local Conflux Core and eSpace operations.</p>
        </div>
        <span className={`pill ${wallet.webHid ? 'ok' : 'warn'}`}>
          {wallet.webHid ? 'WebHID ready' : 'WebHID unavailable'}
        </span>
      </header>

      <section className="workspace">
        <aside className="rail">
          <button
            className={wallet.mode === 'espace' ? 'active' : ''}
            type="button"
            onClick={() => void wallet.setModePath('espace')}
            disabled={wallet.busy || wallet.connected}
          >
            eSpace
          </button>
          <button
            className={wallet.mode === 'core' ? 'active' : ''}
            type="button"
            onClick={() => void wallet.setModePath('core')}
            disabled={wallet.busy || wallet.connected}
          >
            Core
          </button>
        </aside>

        <section className="panel">
          <div className="form-grid">
            <Field
              label="Derivation path"
              value={wallet.path}
              disabled={wallet.busy || wallet.connected}
              onChange={wallet.setPathAndDisconnect}
            />
            <Field label="Local RPC" value={wallet.rpcUrl} onChange={wallet.setRpcUrl} />
          </div>

          <div className="connection-strip">
            <span className={`connection-dot ${wallet.connected ? 'connected' : ''}`} />
            <span>{wallet.connected ? 'Ledger connected' : 'Ledger disconnected'}</span>
            {wallet.state.activity ? <strong>{wallet.state.activity}</strong> : null}
          </div>

          <BalancePanel balance={wallet.balanceLabel} txHash={wallet.state.txHash} />

          <div className="actions">
            <button
              className="primary"
              type="button"
              onClick={() => void wallet.toggleConnection()}
              disabled={!wallet.webHid || wallet.busy}
            >
              {wallet.connected ? 'Disconnect Ledger' : 'Connect Ledger'}
            </button>
            <button
              type="button"
              onClick={() => void wallet.refreshBalance()}
              disabled={!wallet.connected || wallet.busy}
            >
              Refresh balance
            </button>
            <button
              type="button"
              onClick={() => void wallet.signMessage()}
              disabled={!wallet.connected || wallet.busy || wallet.mode === 'core'}
            >
              Sign message
            </button>
            <button
              type="button"
              onClick={() => void wallet.signTransaction()}
              disabled={!wallet.connected || wallet.busy}
            >
              Sign transfer
            </button>
            <button
              type="button"
              onClick={() => void wallet.broadcast()}
              disabled={!wallet.connected || wallet.busy || !wallet.state.rawTx}
            >
              Broadcast signed tx
            </button>
          </div>

          <DevNodePanel
            status={wallet.devNode}
            busy={wallet.busy}
            connected={wallet.connected}
            onStart={() => void wallet.startLocalNode()}
            onStop={() => void wallet.stopLocalNode()}
            onRefresh={() => void wallet.refreshLocalNodeStatus()}
            onMine={() => void wallet.mineLocalNode()}
            onFaucet={() => void wallet.faucetConnectedAddress()}
          />

          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            value={wallet.state.message}
            onChange={(event) => wallet.updateMessage(event.target.value)}
          />
          {wallet.mode === 'core' ? (
            <p className="info-note">
              Published Conflux Core app `2.2.2` does not expose Core message signing. Core
              transaction signing still uses the single `SIGN_TX` APDU protocol from the app source.
            </p>
          ) : null}

          <TransferPanel
            mode={wallet.mode}
            to={wallet.transferTo}
            amount={wallet.transferAmount}
            onToChange={(value) => wallet.updateTransferDraft(value)}
            onAmountChange={(value) => wallet.updateTransferDraft(undefined, value)}
          >
            <TxFields draft={wallet.txDraft} onChange={wallet.setTxDraft} />
            <div className="actions secondary">
              <button
                className="primary"
                type="button"
                onClick={() => void wallet.sendTransfer()}
                disabled={!wallet.connected || wallet.busy}
              >
                Send transfer
              </button>
            </div>
          </TransferPanel>

          <DeployPanel
            mode={wallet.mode}
            busy={wallet.busy}
            connected={wallet.connected}
            contractAddress={wallet.state.contractAddress}
            onDeploy={() => void wallet.deployBasicErc20()}
          />
          <Results results={wallet.state} />

          {wallet.state.error ? <p className="error">{wallet.state.error}</p> : null}
        </section>
      </section>
    </main>
  );
}
