/**
 * `@cfxdevkit/services/keystore-ledger` — Ledger-backed keystore provider.
 *
 * The backend exposes configured Ledger derivation paths as opaque secrets and
 * returns framework `Signer`s. Conflux eSpace is supported through the Ledger
 * Ethereum app; Core Space is supported through the Conflux Ledger APDU app.
 */
export { createLedgerKeystore } from './provider.js';
export { signerFromLedger } from './signer.js';
export { createLedgerEthApp, createNodeHidLedgerTransport } from './transport.js';
export type {
  LedgerAccountConfig,
  LedgerAddressResponse,
  LedgerEthAppLike,
  LedgerKeystoreOptions,
  LedgerSignatureResponse,
  LedgerTransportLike,
  SignerFromLedgerInput,
} from './types.js';
