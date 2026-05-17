## 1. Core Library — `@cfxdevkit/core` DevNode

- [ ] 1.1 In `repos/cfx-core/packages/devnode/src/internals.ts`, replace `deriveAccount` + `coreAddressFromPrivateKey(evmKey)` in `makeAccount` with `deriveDualAccount({ mnemonic, index, coreNetworkId: config.chainId })`
- [ ] 1.2 Remove the `path` parameter from `makeAccount`; derive both eSpace and Core paths internally via `deriveDualAccount`
- [ ] 1.3 Fix `paths: { evm: path, core: path }` to use `result.paths.evm` and `result.paths.core` from `deriveDualAccount`
- [ ] 1.4 Update `createAccounts` to pass `index` (not a path string) and remove inline path construction
- [ ] 1.5 Run `pnpm test` in `repos/cfx-core/packages/devnode` — update any test assertions on Core addresses derived from the default mnemonic

## 2. Keystore Server Domain — `devnode-server/keystore/domain.ts`

- [ ] 2.1 Remove `DEFAULT_DERIVATION_BASE` constant
- [ ] 2.2 Add `DEFAULT_ESPACE_BASE = "m/44'/60'/0'/0"` and `DEFAULT_CORE_BASE = "m/44'/503'/0'/0"` constants
- [ ] 2.3 Add `META_ACCOUNT_TYPE_KEY = 'accountType'` metadata key constant; remove `META_DERIVATION_BASE_KEY`
- [ ] 2.4 Add `DEFAULT_ACCOUNT_TYPE: AccountType = 'standard'` where `type AccountType = 'standard' | 'mining'`
- [ ] 2.5 Replace `walletDerivationBase(secret)` with `walletAccountType(secret): AccountType` — reads `META_ACCOUNT_TYPE_KEY`, falls back to `'standard'` (also handles legacy `META_DERIVATION_BASE_KEY` gracefully)
- [ ] 2.6 Replace `walletDerivationPath(secret, index)` with `walletEspacePath(secret, index): string` and `walletCorePath(secret, index): string` using `DEFAULT_ESPACE_BASE`/`DEFAULT_CORE_BASE` and the account type segment
- [ ] 2.7 Replace `normalizeDerivationBase` with `normalizeAccountType(raw?: string): AccountType`
- [ ] 2.8 Update `toWalletSummary` to emit `accountType` instead of `derivationBase`; rename `firstAddress` → `firstEspaceAddress`

## 3. Keystore Server Operations — `devnode-server/keystore/operations.ts`

- [ ] 3.1 Add `deriveDualAccount` to the import from `@cfxdevkit/core`; remove `deriveAccount` and `coreAddressFromPrivateKey` imports (they are no longer used here)
- [ ] 3.2 In `loadActiveWalletSummary`: replace the single-path derive + bridge-map block with `deriveDualAccount({ mnemonic, index: activeAccountIndex, coreNetworkId })` — `coreNetworkId` is now always required (non-optional)
- [ ] 3.3 In `listWalletAccounts`: same replacement for each account in the loop using `deriveDualAccount({ mnemonic, index, coreNetworkId })`
- [ ] 3.4 In `addWalletSecret`: replace `deriveAccount({ mnemonic, path: ${derivationBase}/0 })` with `deriveDualAccount({ mnemonic, index: 0 })` for `firstEspaceAddress`; store `META_ACCOUNT_TYPE_KEY` instead of `META_DERIVATION_BASE_KEY`
- [ ] 3.5 Update `loadActiveSigner` to accept a `family?: 'espace' | 'core'` option and route to `walletEspacePath` or `walletCorePath` accordingly (default `'espace'`)
- [ ] 3.6 Make `coreNetworkId` parameter required (not optional) in `loadActiveWalletSummary` and `listWalletAccounts` — it is always available from `NetworkState.chainIds().core`
- [ ] 3.7 Update the `ActiveWalletSummary` return object to use `espaceAddress`, `espaceDerivationPath`, `coreDerivationPath`, `coreAddress` (required)

## 4. Keystore Server Types — `devnode-server/src/keystore.ts`

- [ ] 4.1 In `WalletSummary`: rename `derivationBase` → `accountType: 'standard' | 'mining'`; rename `firstAddress?` → `firstEspaceAddress?`
- [ ] 4.2 In `ActiveWalletSummary`: rename `address` → `espaceAddress`; rename `derivationPath` → `espaceDerivationPath`; add `coreDerivationPath: string`; make `coreAddress: string` required
- [ ] 4.3 In `WalletAccountSummary`: rename `address` → `espaceAddress`; rename `derivationPath` → `espaceDerivationPath`; add `coreDerivationPath: string`; make `coreAddress: string` required

## 5. HTTP Client Types — `@cfxdevkit/client/src/types.ts`

- [ ] 5.1 Apply identical renames/changes as task 4.1–4.3 to the client-facing types
- [ ] 5.2 Update mock data in `repos/cfx-tools/packages/client/src/index.namespaces.test.ts` to use new field names and realistic path 60/503 values
- [ ] 5.3 Run `pnpm test` in `repos/cfx-tools/packages/client` to confirm no type or assertion failures

## 6. Keystore HTTP Route Updates — `devnode-server/src/routes/keystore.ts`

- [ ] 6.1 Pass `coreNetworkId` (now required, not optional) to `keystore.activeWallet` and `keystore.listAccounts` — verified it is always available from `options.network?.chainIds().core`
- [ ] 6.2 Remove the `derivationBase` field from the `POST /wallets` request body parsing; add `accountType?: string` in its place
- [ ] 6.3 Update `KeystoreNamespace.addWallet` signature in `namespaces.ts` to accept `accountType` instead of `derivationBase`

## 7. Showcase Session Model — `showcase/keystore-session-model.ts`

- [ ] 7.1 In `deriveAccounts`, replace the loop body (`deriveAccount` + `coreAddressFromPrivateKey(evmKey)`) with `deriveDualAccount({ mnemonic, index, coreNetworkId })`
- [ ] 7.2 Fix `paths: { evm: path, core: path }` to use `result.paths.evm` and `result.paths.core`
- [ ] 7.3 Rename local `evmAddress` → `espaceAddress` in the returned objects; make `coreAddress` required

## 8. Validation

- [ ] 8.1 Run `pnpm -w lint` from workspace root — zero errors
- [ ] 8.2 Run `pnpm -w test` (or per-package equivalents) — no test failures from type changes
- [ ] 8.3 Start the showcase-local dev server, clear local keystore data, create a new wallet, verify the eSpace address matches `m/44'/60'/0'/0/0` and Core address matches `m/44'/503'/0'/0/0` for the same mnemonic using `deriveDualAccount` manually
