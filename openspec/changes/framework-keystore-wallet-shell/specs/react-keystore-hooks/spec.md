## ADDED Requirements

### Requirement: Keystore hooks normalize shared-client lifecycle phases
The system SHALL provide React hooks that expose the backend keystore lifecycle as the canonical phases `blank`, `locked`, `unlocked`, and `active-wallet`, along with the corresponding mutations for setup, unlock, lock, refresh, and reset guidance.

#### Scenario: Blank keystore state
- **WHEN** a consumer renders inside the keystore provider and the backend status phase is `blank`
- **THEN** the hook surface exposes `phase = 'blank'`
- **THEN** setup is available
- **THEN** no active wallet or active account identity is exposed

#### Scenario: Locked keystore state
- **WHEN** the backend status phase is `locked`
- **THEN** the hook surface exposes `phase = 'locked'`
- **THEN** unlock is available
- **THEN** wallet and account selection actions are unavailable until the keystore is unlocked

### Requirement: Active keystore identity is represented as a dual-chain account
The system SHALL expose the selected account as one dual-chain identity using the exact current shared-client semantics: wallet-root metadata plus `espaceAddress`, `coreAddress`, `espaceDerivationPath`, and `coreDerivationPath`.

#### Scenario: Active wallet exposes paired addresses and paths
- **WHEN** the keystore has an active wallet and active account
- **THEN** the hook surface exposes the wallet `id`, `name`, `accountType`, and `activeAccountIndex`
- **THEN** the selected identity exposes `espaceAddress` and `coreAddress`
- **THEN** the selected identity exposes `espaceDerivationPath` and `coreDerivationPath`
- **THEN** the selected account is treated as one derived index under one mnemonic wallet root

### Requirement: Wallet-root and derived-account selection are separate hook concerns
The system SHALL expose wallet-root selection and derived-account selection as distinct actions and state reads.

#### Scenario: Wallet switch changes the active root and refreshes its account inventory
- **WHEN** a consumer activates a different wallet root
- **THEN** the hook surface updates the active wallet metadata
- **THEN** the derived account list refreshes for the newly active wallet
- **THEN** account activation actions operate only on the active wallet's account inventory

#### Scenario: Account switch keeps the current wallet root
- **WHEN** a consumer activates a different account index under the same wallet root
- **THEN** the active wallet `id` remains unchanged
- **THEN** the selected dual-chain identity updates to the chosen derived index
- **THEN** the wallet root is not replaced or re-imported

### Requirement: Keystore hooks remain network-agnostic
The system SHALL keep the keystore hook surface independent from local-node state, network selection, and chain-mode assumptions.

#### Scenario: Consumer renders keystore hooks without local-node state
- **WHEN** a consumer uses the keystore hook surface in a view that does not manage devnode or network state
- **THEN** the hooks still expose lifecycle, wallet, and account behavior
- **THEN** no local-node-specific prerequisite is required to create, unlock, or switch wallets or accounts
