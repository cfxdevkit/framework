## 1. Finalize the canonical backend surface

- [ ] 1.1 Audit the full operation matrix across showcase-local, the VS Code extension, and MCP and turn it into the canonical command set
- [ ] 1.2 Keep keystore persistence on the framework keystore stack and finish backend-owned wallet root and derived account operations
- [ ] 1.3 Add missing backend command families for compiler status/catalog/compile, session-key issue/verify, deploy/read/write, protected reveal flows, and any account/funding hooks needed for later faucet exploration
- [ ] 1.4 Ensure contract operations are network-aware and space-aware throughout the shared runtime surface
- [ ] 1.5 Define the canonical programmatic contract that can be consumed over HTTP or a matching in-process adapter
- [ ] 1.6 Extend `@cfxdevkit/client` so all shared runtime namespaces are typed and reusable

## 2. Add backend extensibility

- [ ] 2.1 Define a supported extension API for attaching custom routes or route groups to the runtime app
- [ ] 2.2 Define the shared service context exposed to custom extensions: controller, keystore, network state, contract registry, and other stable helpers
- [ ] 2.3 Add one end-to-end example custom operation that proves backend reuse and programmatic invocation by returning the current block number

## 3. Add standalone runtime entrypoints

- [ ] 3.1 Add a CLI or daemon entrypoint for serving the local runtime control plane
- [ ] 3.2 Add CLI commands or subcommands for status, lifecycle, mining, wallet/account inspection, and other core runtime operations
- [ ] 3.3 Document local data layout, keystore path behavior, and extension-route startup shape

## 4. Align consumers

- [ ] 4.1 Update showcase-local so compile, session-key, deploy, contract interaction, funding, and reveal flows are all backend-driven
- [ ] 4.2 Refactor the VS Code extension onto the shared command model, preserving its tree UX while reducing direct runtime ownership
- [ ] 4.3 Update MCP docs and handlers so MCP no longer documents a conflicting direct-package lifecycle model and instead aligns to the shared backend contract
- [ ] 4.4 Ensure MCP uses the shared backend contract, whether through HTTP or a matching in-process adapter, while preserving the same command semantics and orchestrated state model

## 5. Validation

- [ ] 5.1 Add route-level tests for the finalized runtime surface
- [ ] 5.2 Add typed-client tests for the finalized namespaces
- [ ] 5.3 Run showcase-local smoke validation against the completed shared control plane
- [ ] 5.4 Run VS Code extension smoke validation against the shared contract
- [ ] 5.5 Run MCP handler validation against the shared contract or matching in-process adapter