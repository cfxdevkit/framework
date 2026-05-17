## ADDED Requirements

### Requirement: Local runtime control plane provides the canonical reusable command surface

The system SHALL provide one canonical local-runtime control plane built on the shared tooling packages. It SHALL expose network selection, node lifecycle, mining, accounts/faucet access, keystore status, wallet root management, derived account management, contract tracking and interaction, compiler/template operations, session-key operations, and deploy/import flows through a stable control contract.

#### Scenario: Multiple consumers inspect the same runtime state through one contract
WHEN showcase-local, the VS Code extension, or another local tool requests runtime status or resource state
THEN they use the same control-plane contract instead of maintaining incompatible local runtime implementations

#### Scenario: Runtime lifecycle and resource actions are managed consistently
WHEN a consumer issues a lifecycle or resource action such as `start`, `stop`, `restart`, `activate account`, `compile`, `deploy`, `call`, or `send`
THEN the canonical control plane performs the action and returns a status or result shape consistent with the shared contract

### Requirement: Backend owns wallet and account logic

The control plane SHALL own wallet root management, derived account listing, active account selection, signer resolution, protected reveal flows, and supported funding flows. Consumers SHALL not need to duplicate account derivation or signer-selection logic.

#### Scenario: Consumer activates a derived account
WHEN a consumer selects an account for subsequent signing operations
THEN the active account state is resolved and stored by the backend rather than by consumer-local logic

#### Scenario: Consumer requests a protected secret reveal
WHEN a consumer performs the approved reveal flow for a mnemonic or private key
THEN the backend enforces the reveal lifecycle and returns the protected material through the shared contract semantics

### Requirement: Local runtime keystore uses framework keystore providers

The control plane SHALL persist local wallets through the framework keystore packages from `@cfxdevkit/services` and `@cfxdevkit/wallet`, not through a package-local vault format.

#### Scenario: Persisted wallet is reusable across consumers
WHEN a wallet is created, unlocked, or selected through the control plane
THEN the stored material and metadata follow the framework keystore provider model and can be reused by all control-plane consumers without translation into a second format

### Requirement: The runtime is extensible with custom project operations

The control plane SHALL allow projects to attach custom routes or route groups that reuse stable shared runtime services.

#### Scenario: Project mounts a custom operation
WHEN a project attaches a custom runtime route
THEN that route can access stable shared services and can be invoked by UI clients or programmatic consumers without copying backend logic into the consumer

### Requirement: Consumers share one integration contract even when transport differs

The VS Code extension and MCP-related tooling SHALL align on the same local-runtime control contract. If a consumer uses an in-process adapter instead of HTTP, that adapter SHALL preserve the same operations, payload shapes, status semantics, and orchestrated state model as the canonical control plane.

#### Scenario: MCP uses an in-process adapter while another tool uses the HTTP client
WHEN both consumers request runtime status or perform the same operation family
THEN the visible behavior, required inputs, and returned result model remain consistent across both integration modes

#### Scenario: Extension, MCP, and showcase observe the same runtime state
WHEN multiple consumers fetch node, wallet, account, or contract state from the runtime
THEN they observe one shared backend-owned state model instead of independent per-consumer lifecycle state

### Requirement: The runtime demonstrates backend extensibility with a simple custom operation

The control plane SHALL include at least one example custom extension operation that projects can use as a model for attaching their own backend logic.

#### Scenario: Custom route returns the current block number
WHEN a project mounts the first demonstrator custom operation
THEN that route can return the current block number while reusing stable shared runtime services and remaining callable by UI and programmatic consumers

### Requirement: The runtime is available as a standalone CLI-managed service

The control plane SHALL provide a standalone entrypoint that developers and tools can run locally. It SHALL support service launch plus core lifecycle and inspection commands over the same backend services.

#### Scenario: Developer starts and inspects the local runtime from the CLI
WHEN the developer launches the control plane and runs a status command
THEN the CLI reports runtime, keystore, wallet, and endpoint status using the same backend state model as other consumers

### Requirement: Showcase-local consumes the control plane as a thin client

The local showcase SHALL consume the canonical local-runtime control plane instead of owning a second bespoke backend implementation.

#### Scenario: Showcase-local invokes a runtime workflow
WHEN the user triggers compile, session-key, deploy, funding, reveal, or contract interaction from the showcase
THEN the app delegates to the shared control plane through a thin adapter or client layer rather than re-implementing that backend logic inside app-local handlers