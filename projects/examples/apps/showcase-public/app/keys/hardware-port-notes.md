# Hardware Wallet Coverage Notes

The release-critical hardware wallet behavior is now covered by `/keys` in `showcase-public`:

- Memory wallet: browser-generated account, eSpace and Core addresses, public testnet balance reads, and message signing.
- Ledger wallet: WebHID availability state, Ledger connection through `@cfxdevkit/wallet/hardware/ledger`, eSpace and Core address derivation, public testnet balance reads, and message signing.
- Browser-only boundary: the public showcase keeps file-keystore and managed keystore flows out of `/keys`.

Superseded legacy behavior:

- Local devnode funding, transaction broadcast, and deploy proofs belong to the local showcase/devnode implementation stream, not the public static showcase.
- File-keystore and managed-keystore demos remain local-only because they require backend or local filesystem assumptions that do not fit the public browser route.
- OneKey and Satochip are supported by `@cfxdevkit/wallet`, but they are not release-blocking for the public showcase hardware section; Ledger plus memory wallet is the `v0.1.0` keeper surface.