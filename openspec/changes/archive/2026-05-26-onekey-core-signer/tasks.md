## P1 — Extend OneKeySdkLike with Core Space methods

- [x] **P1.1** In `wallet/src/hardware/onekey/index.ts`, add to `OneKeySdkLike`:
  ```ts
  confluxGetAddress(connectId, deviceId, params: {
    path: string; showOnOneKey?: boolean; chainId?: number
  }): Promise<OneKeyResponse<{ address: string; path: string }>>;

  confluxSignMessage(connectId, deviceId, params: {
    path: string; messageHex: string
  }): Promise<OneKeyResponse<{ signature: string; address: string }>>;

  confluxSignMessageCIP23(connectId, deviceId, params: {
    path: string; messageHash: string; domainHash: string
  }): Promise<OneKeyResponse<{ signature: string; address: string }>>;

  confluxSignTransaction(connectId, deviceId, params: {
    path: string; transaction: OneKeyCoreCoreTxParams
  }): Promise<OneKeyResponse<{ v: string; r: string; s: string }>>;
  ```
- [x] **P1.2** Add `OneKeyCoreCoreTxParams` type:
  `{ to: string; value: string; gasLimit: string; gasPrice: string; nonce: string; epochHeight: string; storageLimit: string; chainId: number; data?: string }`

## P2 — Add Core Space helpers

- [x] **P2.1** In `wallet/src/hardware/onekey/helpers.ts`, add `toCoreHex(n)` — converts
  `bigint | number | string` to 0x-prefixed hex (same as `toHex` but named for clarity)
- [x] **P2.2** Add `computeCip23Hashes(typedData)` — computes `{ domainHash, messageHash }`
  from a CIP-23 typed-data object using `@cfxdevkit/cdk` or equivalent hashing utilities
- [x] **P2.3** Add `serialiseCoreSignature(v, r, s)` — normalises the `(v, r, s)` tuple
  from `confluxSignTransaction` into a 65-byte `0x`-prefixed hex raw signature

## P3 — Implement `signerFromOneKeyCore`

- [x] **P3.1** Add `SignerFromOneKeyCoreInput` interface in `index.ts`:
  `{ sdk, connectId, deviceId, path?, chainId?, networkId?, expectedAddress?, showOnDevice? }`
- [x] **P3.2** Implement `signerFromOneKeyCore(input)`:
  - Call `sdk.confluxGetAddress` with the resolved path
  - Derive `account.address` (hex) and `account.coreAddress` via `hexToBase32(address, networkId ?? 1029)`
  - Return `Signer` with:
    - `signMessage` → `confluxSignMessage` (convert string/Uint8Array → `messageHex`)
    - `signTypedData` → `computeCip23Hashes(typedData)` then `confluxSignMessageCIP23`
    - `signTransaction` → map `SignableTx` to `OneKeyCoreCoreTxParams` with safe defaults for `epochHeight`/`storageLimit`
- [x] **P3.3** Export `signerFromOneKeyCore` and `SignerFromOneKeyCoreInput` from `index.ts`
- [x] **P3.4** Re-export both from `wallet/src/hardware/onekey/index.ts` (already the module entry)

## P4 — Mark Satochip on-hold

- [x] **P4.1** Add `@on-hold` JSDoc block at the top of `satochip/index.ts`:
  > "Satochip adapter is on hold. The Python bridge sidecar required for PC/SC communication
  > (`http://127.0.0.1:8397`) is not suitable for the current browser showcase surface.
  > The implementation is preserved for future Node/Electron integration."
- [x] **P4.2** Same notice (one-liner) at the top of `satochip/helpers.ts`
- [x] **P4.3** In `wallet/src/hardware/index.ts`, add a comment next to the satochip export
  noting it is on-hold

## Validate

- [x] **V.1** `pnpm run typecheck` passes for `@cfxdevkit/wallet`
- [x] **V.2** `pnpm run test` passes — no existing tests broken
- [x] **V.3** `OneKeySdkLike` has 8 methods total (4 EVM + 4 Core)
- [x] **V.4** `signerFromOneKeyCore` is exported from `@cfxdevkit/wallet/hardware/onekey`
- [x] **V.5** `satochip/index.ts` JSDoc contains `@on-hold`
- [x] **V.6** `pnpm run lint` passes for `@cfxdevkit/wallet`
