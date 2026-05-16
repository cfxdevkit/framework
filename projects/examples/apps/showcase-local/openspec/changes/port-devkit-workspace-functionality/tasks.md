## 1. Network Profile Foundation

- [x] 1.1 Add wallet-scoped persistence for backend network profiles, including mode, public RPC URLs, and effective chain ID overrides.
- [x] 1.2 Load and synchronize wallet-scoped backend context from the active keystore wallet during runtime initialization and wallet switching.
- [x] 1.3 Refactor shared `/network` behavior to expose effective profile state, capabilities, and local/public mode guards.

## 2. Deploy And Contract Orchestration

- [x] 2.1 Port public signer resolution precedence into the shared runtime for Core Space and eSpace write operations.
- [x] 2.2 Refactor backend deploy flows to use the shared network profile for local and public deployments instead of route-local network decisions.
- [x] 2.3 Replace in-memory tracked contract storage with wallet-scoped persistent registry storage and migration-safe loading behavior.
- [x] 2.4 Add tracked contract call flows that work consistently in local and public modes while preserving existing generic ABI read and write routes.

## 3. Account Funding And Consumer Surfaces

- [x] 3.1 Implement Core Space funding parity in the shared accounts API with chain-appropriate confirmation handling.
- [x] 3.2 Extend the shared client and showcase-local backend adapters to expose the new network profile and tracked-contract behavior.
- [x] 3.3 Preserve existing keystore account management, reveal flows, session-key routes, and extension hooks while integrating the new backend context.

## 4. Verification And Documentation

- [x] 4.1 Add focused tests for wallet-scoped profile loading, mode-switch guards, signer resolution precedence, contract persistence, tracked contract calls, and Core/eSpace funding.
- [x] 4.2 Update backend-facing documentation for showcase, VS Code, and MCP consumers to describe canonical local/public behavior and tracked-contract semantics.