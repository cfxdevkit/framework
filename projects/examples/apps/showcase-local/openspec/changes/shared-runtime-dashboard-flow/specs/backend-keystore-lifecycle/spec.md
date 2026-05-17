## ADDED Requirements

### Requirement: Keystore lifecycle state is explicit
The backend and its consumers SHALL model the keystore lifecycle as explicit blank, locked, unlocked, and active-wallet states.

#### Scenario: Blank state before keystore initialization
- **WHEN** a consumer reads keystore status and no keystore exists on disk
- **THEN** the system reports that the keystore is not initialized and exposes no active wallet or derived-account state

#### Scenario: Locked state after keystore creation
- **WHEN** a keystore exists on disk but has not been unlocked for the current backend process
- **THEN** the system reports that the keystore is initialized and locked and does not expose wallet-root or derived-account operations that require unlocked secret access

#### Scenario: Active-wallet state after successful unlock
- **WHEN** the keystore is unlocked and at least one wallet root is present
- **THEN** the system reports the active wallet, the configured derived-account inventory for that wallet, and any wallet-scoped backend state that depends on the active wallet

### Requirement: Wallet creation fixes derived account count
Wallet creation and wallet import SHALL define a fixed derived-account count for the wallet root in this change.

#### Scenario: Generate wallet with explicit account count
- **WHEN** a consumer creates a wallet root by generating a new mnemonic and supplies an account count
- **THEN** the backend stores that account count on the wallet root and exposes that many derived account indexes for both Core and eSpace address families

#### Scenario: Import wallet with explicit account count
- **WHEN** a consumer imports a mnemonic and supplies an account count
- **THEN** the backend stores that account count on the wallet root and exposes the matching derived account inventory for that wallet

### Requirement: Reset returns the runtime to a blank state
The system SHALL support a full destructive reset that removes the keystore and associated runtime state and returns the environment to a blank first-run state.

#### Scenario: Operator performs full reset
- **WHEN** an operator runs the documented reset workflow
- **THEN** the keystore, wallet-scoped runtime state, and other reset-owned persisted state are removed and the next backend startup reports an uninitialized keystore

#### Scenario: UI presents reset as guidance instead of runtime mutation
- **WHEN** a user needs to start over from a locked or unrecoverable keystore state
- **THEN** the consumer UI presents explicit warnings and operator instructions for the reset workflow instead of invoking a destructive passwordless HTTP reset action
