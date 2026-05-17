## Context

Conflux has two independently secured blockchain spaces. BIP-44 assigns separate coin types for each:
- **eSpace**: coin type `60` → path `m/44'/60'/{account}'/0/{index}` → derives an **EVM private key** → standard `0x…` address
- **Core Space**: coin type `503` → path `m/44'/503'/{account}'/0/{index}` → derives a **different private key** → `cfx:`/`net…:` Conflux Base32 address

`@cfxdevkit/core` already exposes `deriveDualAccount(mnemonic, index, coreNetworkId)` which correctly derives both paths and returns `{ evmAddress, coreAddress, paths: { evm, core } }`.

The function `coreAddressFromPrivateKey(key, networkId)` exists for the cross-space bridge — it converts an arbitrary private key's public key into the Conflux Base32 encoding. When applied to an **eSpace private key (path 60)**, it produces a valid but misleading address: the user can sign Core transactions with that EVM key, but the address will never match any Fluent wallet account derived from the same mnemonic.

Four call sites pass an EVM-path key to `coreAddressFromPrivateKey` instead of using `deriveDualAccount`. They are all corrected in this change.

## Goals / Non-Goals

**Goals:**
- Correct `loadActiveWalletSummary` and `listWalletAccounts` in the keystore server to derive both paths
- Correct `makeAccount` in the DevNode genesis account builder to use `deriveDualAccount`
- Correct `deriveAccounts` in the showcase session model
- Replace the single-path `DEFAULT_DERIVATION_BASE` with dual-path constants and account-type-based metadata in the keystore server domain
- Update `@cfxdevkit/client` types to reflect the dual-path data model with required `coreAddress`
- Ensure the `loadActiveSigner` in the keystore server signs with the correct key per chain family

**Non-Goals:**
- Adding a dual-key `Signer` to `@cfxdevkit/core` (the `signerFromPrivateKey` single-key design remains; the server re-derives at the appropriate path when needed)
- Supporting Fluent wallet as a browser provider in `@cfxdevkit/react` (next phase)
- Browser wallet coexistence (MetaMask + Fluent simultaneously) — next phase
- Migrating existing `keystore.json` files — dev-only tool, data must be cleared

## Decisions

### 1. Use `deriveDualAccount` for address derivation, keep `getSigner` single-path for signing

**Chosen**: When computing account addresses for display (listing, active wallet summary), call `deriveDualAccount(mnemonic, index, coreNetworkId)`. For signing, the existing `getSigner(ref, opts, { derivationPath })` call is retained — pass the **eSpace path** (`m/44'/60'/0'/0/{index}`) for eSpace signing and the **Core path** (`m/44'/503'/0'/0/{index}`) for Core signing. Both paths can be derived from the same stored mnemonic by specifying the path.

**Rationale**: No changes required to `@cfxdevkit/services/keystore-file`. The `getSigner` already accepts any BIP-32 derivation path. Routing by family at the signing call site is clear and explicit.

**Alternative considered**: Add `corePrivateKey` to `DualAddressAccount`. Rejected — exposing Core private keys in data structures creates unnecessary risk and requires changes to `@cfxdevkit/core`.

### 2. Replace `derivationBase` metadata with `accountType`

**Chosen**: The `META_DERIVATION_BASE_KEY` wallet metadata field (a free-form path string like `"m/44'/60'/0'/0"`) is replaced with `META_ACCOUNT_TYPE_KEY` storing `'standard' | 'mining'`. `deriveDualAccount` accepts `accountType` which maps to segment 0 or 1. The dual paths are always derived from this type, not stored.

**Rationale**: With dual derivation, there is no single "derivation base" — there are always two. Storing both paths adds no value since they are deterministic from the account type. Simplifying to `accountType` removes the ability to configure arbitrary paths (which was never a real user feature) in exchange for correct, predictable derivation.

**Migration**: Existing wallets with `META_DERIVATION_BASE_KEY` in metadata treat the absence of `META_ACCOUNT_TYPE_KEY` as `'standard'` (the default). A read-compatibility shim normalizes old metadata.

### 3. Breaking type changes in `@cfxdevkit/client`

**Chosen**: Rename fields in `WalletAccountSummary`, `ActiveWalletSummary`, and `WalletSummary` to be explicit about chain family. `coreAddress` becomes required (`string`, not `string | undefined`).

| Old | New |
|-----|-----|
| `address` | `espaceAddress` |
| `derivationPath` | `espaceDerivationPath` |
| — | `coreDerivationPath` (new) |
| `coreAddress?` | `coreAddress` (required) |
| `derivationBase` | `accountType` |
| `firstAddress?` | `firstEspaceAddress?` |

**Rationale**: Keeping old names would silently allow consumers to treat the wrong field as correct. Explicit names prevent the class of confusion that caused the original bug.

### 4. DevNode genesis accounts use `deriveDualAccount`

**Chosen**: `makeAccount` in `repos/cfx-core/packages/devnode/src/internals.ts` switches to `deriveDualAccount`. The `paths` field gets correct separate `evm`/`core` values.

**Impact**: Any hardcoded Core address expectations in DevNode tests must be updated. The devnode test suite should be re-run.

## Risks / Trade-offs

- **Existing local keystore data is silently wrong after the fix** → Mitigation: clear `.local-data/keystore.json` before restarting the devnode server. Document in CHANGELOG.
- **DevNode test assertions on Core addresses break** → Mitigation: update test expectations to use `deriveDualAccount` reference values.
- **Showcase session model (`showcase` app) is a separate package** → Mitigation: fix is included in this change; the `showcase` app is a sibling example, not consumed by other packages.
- **`getSigner` may not support Core path derivation** → Mitigation: verified that `@cfxdevkit/services/keystore-file`'s `getSigner` accepts any BIP-32 path string — it re-derives from the stored mnemonic. Both path 60 and path 503 work.

## Migration Plan

1. Apply code changes (all in this change)
2. Clear existing dev keystore data: `rm -f .local-data/keystore.json .local-data/keystore.json.runtime`
3. Re-run `pnpm -w lint` and `pnpm -w test` (where available)
4. Re-create any wallets in the keystore UI — new derivation will produce correct addresses
