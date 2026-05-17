## ADDED Requirements

### Requirement: Keystore accounts use independent BIP-44 dual-path derivation
The keystore server SHALL derive each wallet account using two independent BIP-44 paths — coin type 60 for eSpace and coin type 503 for Core Space — producing separate private keys and separate addresses. The function `coreAddressFromPrivateKey` SHALL NOT be applied to an eSpace-path (coin type 60) private key for the purpose of computing wallet account addresses.

#### Scenario: Account listing returns independent addresses for both spaces
- **WHEN** `listWalletAccounts` is called for a wallet at index 0
- **THEN** the returned `espaceAddress` SHALL match the address derived at `m/44'/60'/0'/0/0`
- **THEN** the returned `coreAddress` SHALL match the address derived at `m/44'/503'/0'/0/0`
- **THEN** `espaceAddress` and the EVM representation of `coreAddress` SHALL be different values (different private keys)

#### Scenario: Active wallet summary reflects dual-path derivation
- **WHEN** `loadActiveWalletSummary` is called with a `coreNetworkId`
- **THEN** `espaceAddress` is from the eSpace path key
- **THEN** `coreAddress` is from the Core path key
- **THEN** `coreAddress` is always present (not undefined)

#### Scenario: New wallet first address uses eSpace path
- **WHEN** `addWalletSecret` is called with a mnemonic
- **THEN** the stored `firstEspaceAddress` is derived from `m/44'/60'/0'/0/0`

### Requirement: Wallet metadata uses account type instead of derivation base
The keystore server SHALL store `accountType` (`'standard' | 'mining'`) in wallet metadata instead of a free-form `derivationBase` path string. Both paths are derived deterministically from this value.

#### Scenario: Standard wallet account type segment
- **WHEN** a wallet is created without specifying `accountType`
- **THEN** it defaults to `'standard'`
- **THEN** eSpace path uses segment `0'`: `m/44'/60'/0'/0/{index}`
- **THEN** Core path uses segment `0'`: `m/44'/503'/0'/0/{index}`

#### Scenario: Mining wallet account type segment
- **WHEN** a wallet is created with `accountType: 'mining'`
- **THEN** eSpace path uses segment `1'`: `m/44'/60'/1'/0/{index}`
- **THEN** Core path uses segment `1'`: `m/44'/503'/1'/0/{index}`

#### Scenario: Legacy wallets with derivationBase metadata are read as standard type
- **WHEN** a stored wallet has `META_DERIVATION_BASE_KEY` but no `META_ACCOUNT_TYPE_KEY`
- **THEN** the wallet SHALL behave as `accountType: 'standard'`

### Requirement: DevNode genesis accounts use independent dual-path derivation
The DevNode account builder SHALL use `deriveDualAccount` for each genesis account, so that eSpace and Core addresses come from independent coin-type paths and `paths.evm !== paths.core`.

#### Scenario: DevNode account paths are distinct
- **WHEN** `createAccounts` builds genesis account at index 0
- **THEN** `paths.evm` equals `m/44'/60'/0'/0/0`
- **THEN** `paths.core` equals `m/44'/503'/0'/0/0`
- **THEN** `evmAddress` and the EVM representation of `coreAddress` are different

### Requirement: `@cfxdevkit/client` types expose dual-path fields with required Core address
The `WalletAccountSummary`, `ActiveWalletSummary`, and `WalletSummary` types SHALL use explicit per-space field names and SHALL require `coreAddress` as a non-optional string.

#### Scenario: WalletAccountSummary has required coreAddress and split derivation paths
- **WHEN** a `WalletAccountSummary` is received from the keystore API
- **THEN** `espaceAddress` is present and is a `0x…` hex string
- **THEN** `coreAddress` is present and is a Conflux Base32 address string
- **THEN** `espaceDerivationPath` is present and begins with `m/44'/60'/`
- **THEN** `coreDerivationPath` is present and begins with `m/44'/503'/`

#### Scenario: WalletSummary exposes accountType instead of derivationBase
- **WHEN** a `WalletSummary` is received
- **THEN** `accountType` is either `'standard'` or `'mining'`
- **THEN** no `derivationBase` field is present
