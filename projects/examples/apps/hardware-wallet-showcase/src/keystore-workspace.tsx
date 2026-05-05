import type { KeystoreBackendInfo } from './keystore-demo.js';
import { LedgerWorkspace } from './ledger-workspace.js';
import { ManagedKeystoreWorkspace } from './managed-keystore-workspace.js';
import type { useWalletController } from './wallet-controller.js';

export type WalletController = ReturnType<typeof useWalletController>;

export function KeystoreWorkspace(props: {
  backend: KeystoreBackendInfo;
  wallet: WalletController;
}) {
  if (props.backend.id === 'ledger') {
    return <LedgerWorkspace wallet={props.wallet} />;
  }
  return <ManagedKeystoreWorkspace backend={props.backend} wallet={props.wallet} />;
}
