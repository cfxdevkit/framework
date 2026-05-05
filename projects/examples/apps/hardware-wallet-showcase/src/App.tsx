import { ShowcaseNav } from '@cfxdevkit/example-showcase-ui';
import { useState } from 'react';
import { KEYSTORE_BACKENDS, type KeystoreBackendId } from './keystore-demo.js';
import { KeystoreBackendDetails, KeystoreBackendMatrix } from './keystore-ui.js';
import { KeystoreWorkspace } from './keystore-workspace.js';
import { useWalletController } from './wallet-controller.js';

export function App() {
  const wallet = useWalletController();
  const [activeBackend, setActiveBackend] = useState<KeystoreBackendId>('memory');
  const defaultBackend = KEYSTORE_BACKENDS[0] as (typeof KEYSTORE_BACKENDS)[number];
  const selectedBackend =
    KEYSTORE_BACKENDS.find((backend) => backend.id === activeBackend) ?? defaultBackend;
  const selectBackend = (backend: KeystoreBackendId) => {
    setActiveBackend(backend);
    void wallet.selectBackend(backend);
  };

  return (
    <main className="app-shell">
      <ShowcaseNav current="keystores" />
      <header className="topbar">
        <div>
          <h1>Keystore management showcase</h1>
          <p>
            Compare memory, encrypted file, and Ledger-backed signers with room for OneKey and
            Satochip adapters.
          </p>
        </div>
        <span className={`pill ${wallet.webHid ? 'ok' : 'warn'}`}>
          {selectedBackend.id === 'ledger'
            ? wallet.webHid
              ? 'WebHID ready'
              : 'WebHID unavailable'
            : selectedBackend.status}
        </span>
      </header>

      <KeystoreBackendMatrix
        backends={KEYSTORE_BACKENDS}
        active={activeBackend}
        onSelect={selectBackend}
      />

      <KeystoreBackendDetails backend={selectedBackend} />

      <KeystoreWorkspace backend={selectedBackend} wallet={wallet} />
    </main>
  );
}
