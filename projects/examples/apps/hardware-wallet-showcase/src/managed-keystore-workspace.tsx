import { useState } from 'react';
import type { KeystoreBackendInfo } from './keystore-demo.js';
import type { WalletController } from './keystore-workspace.js';
import {
  BalancePanel,
  DeployPanel,
  DevNodePanel,
  Results,
  TransferPanel,
  TxFields,
} from './wallet-ui.js';

export function ManagedKeystoreWorkspace(props: {
  backend: KeystoreBackendInfo;
  wallet: WalletController;
}) {
  const { backend, wallet } = props;
  const [passphrase, setPassphrase] = useState('showcase-file-passphrase');
  const kind = backend.id === 'file' ? 'file' : 'memory';
  const memoryReady = backend.id === 'memory' && wallet.managedConnected;
  const fileReady = backend.id === 'file' && wallet.fileUnlocked;
  const planned = backend.status === 'planned';
  const active = memoryReady || fileReady || planned;
  const status = memoryReady
    ? 'Memory signer ready'
    : fileReady
      ? 'Encrypted file signer unlocked'
      : planned
        ? `${backend.name} adapter slot reserved`
        : `${backend.name} selected`;
  const usable = memoryReady || fileReady;

  return (
    <section className="workspace">
      <aside className="rail">
        <span className="rail-label">Keystore network</span>
        <button
          className={wallet.mode === 'espace' ? 'active' : ''}
          type="button"
          onClick={() => void wallet.setModePath('espace')}
          disabled={wallet.busy}
        >
          eSpace
        </button>
        <button
          className={wallet.mode === 'core' ? 'active' : ''}
          type="button"
          onClick={() => void wallet.setModePath('core')}
          disabled={wallet.busy}
        >
          Core
        </button>
      </aside>

      <section className="panel">
        <div className="connection-strip">
          <span className={`connection-dot ${active ? 'connected' : ''}`} />
          <span>{status}</span>
          {wallet.state.activity ? <strong>{wallet.state.activity}</strong> : null}
        </div>

        <div className="operation-state-grid">
          <div>
            <span>Selected backend</span>
            <strong>{backend.name}</strong>
          </div>
          <div>
            <span>Storage</span>
            <strong>{backend.storage}</strong>
          </div>
          <div>
            <span>Signer</span>
            <strong>{backend.signer}</strong>
          </div>
        </div>

        {backend.id === 'file' ? (
          <div className="form-row">
            <label htmlFor="file-passphrase">Passphrase</label>
            <input
              id="file-passphrase"
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
            />
          </div>
        ) : null}

        <div className="actions">
          <button
            className="primary"
            type="button"
            onClick={() =>
              backend.id === 'file'
                ? void wallet.unlockFile(passphrase)
                : void wallet.connectMemory(wallet.state.message)
            }
            disabled={wallet.busy || planned}
          >
            {backend.id === 'file'
              ? fileReady
                ? 'Unlock again'
                : 'Unlock keystore'
              : memoryReady
                ? 'Reset account'
                : 'Create account'}
          </button>
          <button
            type="button"
            onClick={() => void wallet.refreshManagedBalance(kind)}
            disabled={wallet.busy || !usable}
          >
            Refresh balance
          </button>
        </div>

        <BalancePanel balance={wallet.balanceLabel} txHash={wallet.state.txHash} />

        <DevNodePanel
          status={wallet.devNode}
          busy={wallet.busy}
          connected={usable}
          onStart={() => void wallet.startLocalNode()}
          onStop={() => void wallet.stopLocalNode()}
          onRefresh={() => void wallet.refreshLocalNodeStatus()}
          onMine={() => void wallet.mineLocalNode()}
          onFaucet={() => void wallet.faucetManaged(kind)}
        />

        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          value={wallet.state.message}
          onChange={(event) => wallet.updateMessage(event.target.value)}
        />

        <div className="actions">
          <button
            type="button"
            onClick={() => void wallet.signManagedMessage(kind)}
            disabled={wallet.busy || !usable}
          >
            Sign message
          </button>
          <button
            type="button"
            onClick={() => void wallet.signManagedTransaction(kind)}
            disabled={wallet.busy || !usable}
          >
            Sign transfer
          </button>
          <button
            type="button"
            onClick={() => void wallet.broadcastManaged(kind)}
            disabled={wallet.busy || !usable || !wallet.state.rawTx}
          >
            Broadcast signed tx
          </button>
        </div>

        <BackendOperationNote backend={backend} />

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
              onClick={() => void wallet.sendManagedTransfer(kind)}
              disabled={wallet.busy || !usable}
            >
              Send transfer
            </button>
          </div>
        </TransferPanel>

        <DeployPanel
          mode={wallet.mode}
          busy={wallet.busy}
          connected={usable}
          contractAddress={wallet.state.contractAddress}
          onDeploy={() => void wallet.deployManaged(kind)}
        />
        <Results results={wallet.state} />
        {wallet.state.error ? <p className="error">{wallet.state.error}</p> : null}
      </section>
    </section>
  );
}

function BackendOperationNote(props: { backend: KeystoreBackendInfo }) {
  if (props.backend.id === 'memory') {
    return (
      <p className="info-note">
        Memory keeps the private key in the browser session and exposes the full signer flow: sign
        messages, sign or broadcast transfers, send directly, fund from the devnode, and deploy on
        either chain.
      </p>
    );
  }
  if (props.backend.id === 'file') {
    return (
      <p className="info-note">
        The encrypted file provider is unlocked by the backend companion, then follows the same
        account flow as Memory while keeping private material inside the encrypted file keystore.
      </p>
    );
  }
  return (
    <p className="info-note">
      {props.backend.name} keeps the same operation slots as the other keystores. The vendor
      connection, bridge health check, and signer wiring can be enabled without reshaping the page.
    </p>
  );
}
