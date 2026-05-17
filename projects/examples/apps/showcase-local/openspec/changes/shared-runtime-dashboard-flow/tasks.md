## 1. Backend Keystore Lifecycle

- [x] 1.1 Define the full reset scope for the reusable runtime, including keystore and associated wallet-scoped runtime state that must be cleared together.
- [x] 1.2 Add backend primitives and status behavior for blank, locked, unlocked, and active-wallet lifecycle states without exposing a passwordless HTTP reset mutation.
- [x] 1.3 Document the operator/CLI reset workflow and expose the necessary reset guidance inputs for consumer UIs.
- [x] 1.4 Verify wallet creation and import flows preserve a fixed derived-account count per wallet root for both Core and eSpace address inventories.

## 2. Shared Client Parity

- [x] 2.1 Extend `@cfxdevkit/client` keystore support to cover the low-level wallet and derived-account primitives required by the reusable backend.
- [x] 2.2 Extend shared client support for backend-owned network and node-control primitives needed by the dashboard lifecycle, including local wipe support where applicable.
- [x] 2.3 Normalize shared client terminology and response handling so wallet-root and derived-account operations match backend semantics exactly.
- [x] 2.4 Add or update shared client tests for keystore lifecycle, wallet/account operations, and backend-owned network state reads.

## 3. Showcase-Local Runtime Alignment

- [x] 3.1 Replace showcase-local control-plane fetch wrappers and semantic aliases with the canonical shared client primitives.
- [x] 3.2 Refactor showcase-local runtime state management to branch cleanly between blank, locked, unlocked, and active-wallet dashboard states.
- [x] 3.3 Remove hidden demo assumptions from the onboarding flow, including implicit passphrase and default mnemonic behavior.
- [ ] 3.4 Rework the keystore and main runtime workspace into a dashboard that reveals network, node, compiler, deploy, wallet management, and app-extension sections when backend state makes them actionable.
- [x] 3.5 Consolidate operation logging into a contained footer/log surface and reduce passive startup log noise.

## 4. Multi-Consumer State Coherence

- [ ] 4.1 Ensure backend-owned network state remains authoritative for showcase-local, VS Code, and MCP consumers attached to the same runtime.
- [ ] 4.2 Verify consumer refresh flows and mutation responses are sufficient for concurrent clients to observe the same backend state transitions.
- [ ] 4.3 Document any remaining gaps that require future eventing or higher-level reusable workflow helpers.

## 5. Verification And Documentation

- [ ] 5.1 Add backend and showcase-local tests covering blank-state onboarding, locked-state unlock, fixed account-count wallet creation/import, and active-wallet runtime flows.
- [x] 5.2 Validate local node controls, backend-owned network selection, and local/public runtime transitions against the shared client surface.
- [x] 5.3 Update consumer-facing documentation so showcase-local, VS Code, and MCP integrations use the same wallet/account terminology and reset guidance.
