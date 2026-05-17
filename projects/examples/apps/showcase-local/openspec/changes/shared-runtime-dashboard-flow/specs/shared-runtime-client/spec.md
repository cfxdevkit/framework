## ADDED Requirements

### Requirement: Shared client is the canonical low-level runtime client
The shared `@cfxdevkit/client` package SHALL provide the canonical low-level control-plane contract for the reusable backend.

#### Scenario: Consumer uses shared client for keystore lifecycle reads and mutations
- **WHEN** showcase-local, VS Code, MCP, or another consumer needs to read or mutate runtime keystore state
- **THEN** it can do so through shared client primitives that map directly to the backend contract without redefining wallet/account semantics locally

#### Scenario: Shared client covers active wallet and derived account flows
- **WHEN** a consumer needs to read the active wallet, list derived accounts, or activate a derived account
- **THEN** the shared client exposes low-level primitives for those operations instead of requiring app-local fetch wrappers

### Requirement: Shared client terminology matches backend terminology
The shared client SHALL preserve the backend distinction that a wallet is a mnemonic root and an account is a derived child index under that wallet.

#### Scenario: Wallet-root operations stay wallet-scoped
- **WHEN** a consumer lists, creates, renames, activates, or deletes mnemonic roots
- **THEN** the shared client exposes those operations as wallet-root operations rather than renaming them as account operations

#### Scenario: Derived-account operations stay account-scoped
- **WHEN** a consumer activates or lists derived indexes for a wallet
- **THEN** the shared client exposes those operations as account operations nested beneath the wallet context

### Requirement: Shared client supports status-driven multi-client coordination
The shared client SHALL expose backend status reads and mutation surfaces suitable for multiple consumers attaching to the same running backend process.

#### Scenario: Two consumers observe the same backend-owned network state
- **WHEN** one consumer changes backend-owned runtime state such as the selected network profile
- **THEN** another consumer can read the current backend state through the same shared client surface and observe the updated value without relying on consumer-local shadow state

#### Scenario: Consumer refreshes after mutation
- **WHEN** a consumer performs a runtime mutation through the shared client
- **THEN** the shared client and backend response model provide enough low-level information for the consumer to refresh or reconcile the new authoritative backend state
