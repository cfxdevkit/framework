## Why

> Closure note (2026-05-17): Archive this change as already landed elsewhere. The targeted files now use `deriveDualAccount` and dual-chain fields in the current repo state, including `repos/cfx-core/packages/devnode/src/internals.ts`, `repos/cfx-tools/packages/devnode-server/src/keystore/operations.ts`, `repos/cfx-tools/packages/devnode-server/src/keystore/domain.ts`, and `repos/cfx-tools/packages/client/src/types.ts`.

Conflux has two independent blockchain spaces — eSpace (coin type 60, `m/44'/60'/…`) and Core Space (coin type 503, `m/44'/503'/…`) — which derive **different private keys and different addresses** from the same mnemonic. Four locations in the codebase instead derive only the EVM key (path 60) and then apply `coreAddressFromPrivateKey(evmKey, networkId)` to get a Core address via cross-space bridge mapping, which is an entirely different operation. This produces silently wrong Core addresses that do not match any standard BIP-44 Core wallet (e.g., Fluent), corrupting every account displayed to users and every Core signing operation performed by the keystore server.

## What Changes

- **`repos/cfx-tools/packages/devnode-server/src/keystore/domain.ts`** — **BREAKING**: Remove `DEFAULT_DERIVATION_BASE` (EVM-only path string). Add `DEFAULT_ESPACE_BASE` and `DEFAULT_CORE_BASE` constants. Replace single-path `walletDerivationBase`/`walletDerivationPath` helpers with dual-path equivalents. Replace `META_DERIVATION_BASE_KEY` metadata with `META_ACCOUNT_TYPE_KEY` (`'standard' | 'mining'`), which maps to account segment 0/1 inside `deriveDualAccount`.
- **`repos/cfx-tools/packages/devnode-server/src/keystore/operations.ts`** — **BREAKING**: Replace `deriveAccount(…evm path…)` + `coreAddressFromPrivateKey(evmKey)` with `deriveDualAccount(mnemonic, index, coreNetworkId)` in `loadActiveWalletSummary` and `listWalletAccounts`. Update `addWalletSecret` to store the first eSpace address and derive it from the eSpace path. Ensure signing still uses `getSigner` with the correct path per family.
- **`repos/cfx-tools/packages/client/src/types.ts`** — **BREAKING**: In `WalletAccountSummary`: rename `address` → `espaceAddress`, split `derivationPath` → `espaceDerivationPath` + `coreDerivationPath`, make `coreAddress: string` required. In `ActiveWalletSummary`: same renames, `coreAddress: string` required. In `WalletSummary`: replace `derivationBase: string` with `accountType: 'standard' | 'mining'`, rename `firstAddress` → `firstEspaceAddress`.
- **`repos/cfx-core/packages/devnode/src/internals.ts`** — Fix `makeAccount` to use `deriveDualAccount` so genesis accounts expose correct separate eSpace/Core addresses and correct dual `paths: { evm, core }`.
- **`projects/examples/apps/showcase/src/contexts/keystore-session-model.ts`** — Replace EVM-only `deriveAccounts` with `deriveDualAccount`-based derivation; fix `paths` to use correct separate paths.

## Capabilities

### New Capabilities

- `dual-chain-account-derivation`: Keystore accounts are always derived at both eSpace path (coin type 60) and Core path (coin type 503), producing independent private keys and correct BIP-44 addresses for both spaces.

### Modified Capabilities

<!-- No existing specs have requirement-level changes; this corrects a silent data-integrity bug. -->

## Impact

- **Existing keystore files are invalidated** — Core addresses stored in any existing `keystore.json` were computed via bridge mapping and will differ from re-derived dual-path addresses. Local development data must be cleared; no production data is affected (dev-only tool).
- **`@cfxdevkit/client` type breaking change** — All consumers of `WalletAccountSummary`, `ActiveWalletSummary`, and `WalletSummary` must update field names.
- **DevNode genesis account Core addresses change** — Any test asserting a specific Core address from the default mnemonic will need updating.
- **No external API shape change** — HTTP response JSON field names align with the new type names; the server serialises `espaceAddress`, `espaceDerivationPath`, `coreDerivationPath`, `accountType`.
