## Context

The current reusable backend already has the right internal split: `@cfxdevkit/devnode-server` owns keystore, node, network, deploy, contract, and session-key behavior, while showcase-local embeds that backend through thin Next adapters. The drift appears above the backend core. The shared `@cfxdevkit/client` package exposes only part of the runtime surface, and showcase-local fills the gap with app-local fetch wrappers and UI-specific route aliases. The result is that wallet/account semantics, keystore lifecycle state, and network control-plane behavior are not expressed through one canonical client contract.

The desired control-plane model is now clear:
- the backend owns network state for all operations;
- a wallet is a mnemonic root and an account is a derived index under that wallet;
- each account index yields both one Core address and one eSpace address;
- multiple consumers such as showcase-local, VS Code, and MCP should be able to attach to the same running backend, observe the same status, and remain semantically aligned;
- destructive reset should exist, but as an operator/CLI flow with strong user guidance instead of as a passwordless HTTP action.

## Goals / Non-Goals

**Goals:**
- Make the shared client the canonical low-level consumer surface for the reusable backend.
- Express the full keystore lifecycle through backend and client primitives: blank, locked, unlocked, active wallet, and operator reset.
- Keep network selection backend-owned and observable so all clients operate against the same runtime state.
- Reshape showcase-local into a lifecycle-driven dashboard that consumes shared client semantics instead of inventing its own parallel model.
- Keep the current derived-account model fixed for now: one configured account count per wallet, where each account index yields both Core and eSpace addresses.

**Non-Goals:**
- Add a passwordless HTTP reset route for the keystore.
- Introduce account-count mutation or derivation-window extension after wallet creation in this change.
- Add a high-level reusable onboarding workflow abstraction to the shared client before the low-level primitive surface is complete and proven.
- Solve websocket/event-stream synchronization in this change; status coherence can initially rely on explicit refresh and polling-friendly primitives.

## Decisions

### Decision: Keep reset as an operator-level full wipe, not a runtime API
The system SHALL define reset as a full destructive wipe of keystore and associated runtime state, but SHALL expose it as a CLI/operator workflow with UI instructions instead of as a normal backend API route.

Rationale:
- The reset path exists specifically because the passphrase may be lost and therefore cannot rely on authenticated in-app flows.
- A passwordless HTTP reset endpoint would be too dangerous for the shared backend control plane.
- UI guidance is still necessary so showcase-local can help users recover to a blank state without hiding the operational truth.

Alternatives considered:
- Add a destructive backend `/reset` route: rejected because it makes a blank-state recovery operation remotely callable without a trustworthy authorization model.
- Skip reset entirely: rejected because it leaves users stranded once a passphrase is lost.

### Decision: Make the shared client the canonical consumer contract
The implementation SHALL expand `@cfxdevkit/client` until it can represent the reusable backend surface directly, and showcase-local SHALL consume that package instead of maintaining parallel fetch wrappers for core runtime behaviors.

Rationale:
- Shared semantics are more important than shared transport code.
- VS Code, MCP, and showcase-local need the same understanding of wallets, accounts, network state, and node lifecycle.
- A canonical low-level client makes later higher-level workflow helpers possible without locking them into showcase-specific assumptions.

Alternatives considered:
- Keep app-local clients and document expected behavior: rejected because semantic drift has already appeared.
- Add high-level wizard helpers first: rejected because the primitive surface is not yet complete enough to stabilize.

### Decision: Drive the dashboard from backend lifecycle state
showcase-local SHALL render a dashboard whose sections and actions are driven by backend lifecycle state instead of exposing all keystore and runtime options at once.

Rationale:
- The real user journey is stateful: create or unlock a keystore, establish an active wallet, choose network, then operate the runtime.
- The current flat UI forces users to infer prerequisites that the backend already knows.
- A state-driven dashboard can still expose full capability, but at the right time and in the right grouping.

Alternatives considered:
- Keep the current panel model and only restyle it: rejected because the current problem is workflow shape, not only presentation.
- Build a strict linear wizard with no dashboard behavior: rejected because users still need a persistent operational surface once onboarding is complete.

### Decision: Keep account count fixed at wallet creation for now
Wallet creation and import SHALL define a fixed derived-account count for that wallet in this change.

Rationale:
- The local devnode profile model depends on a stable wallet shape.
- Fixed account count reduces hidden state changes while the base shared flow is being stabilized.
- Derivation customization can be added later once the base lifecycle and cross-client contract are solid.

Alternatives considered:
- Support dynamic account-count growth now: rejected because it introduces more backend and client state transitions before the base model is proven.

### Decision: Treat multi-client synchronization as a status-contract problem first
The shared backend and client SHALL prioritize authoritative status reads and mutation responses so multiple concurrent consumers can stay aligned against the same backend process.

Rationale:
- Showcase-local, VS Code, and MCP need to observe one backend-owned truth.
- The current `HttpClient` and route model already supports polling-friendly reads and mutation-driven refresh.
- This makes the control-plane contract robust before introducing more advanced streaming or push synchronization.

Alternatives considered:
- Require real-time push synchronization in the same change: rejected because it expands scope beyond the minimum solid shared base.

## Risks / Trade-offs

- [The UI becomes too showcase-specific again] -> Keep dashboard behavior driven by shared backend states and shared client primitives rather than app-local semantics.
- [CLI-only reset feels hidden] -> Make the UI surface reset instructions explicitly whenever the keystore exists but cannot be unlocked or the user needs to start over.
- [Shared client parity work expands too far] -> Focus first on low-level keystore, node, network, and status primitives needed by the current real flows.
- [Multiple clients observe stale state] -> Standardize current-state reads and require consumers to refresh after mutations or on focus until a future eventing model is introduced.
- [Old showcase defaults leak into the new lifecycle] -> Remove hidden passphrase and demo mnemonic assumptions from the dashboard flow and treat blank-state setup as explicit user input.

## Migration Plan

1. Expand the shared client surface until it covers the backend primitives required by keystore lifecycle, network selection, node control, and wallet/account management.
2. Refactor showcase-local runtime adapters and workspace logic to consume the shared client package instead of app-local control-plane fetch wrappers.
3. Add backend/operator guidance for full reset and define which persistent runtime state is cleared alongside the keystore.
4. Reshape showcase-local into a state-driven dashboard that branches between blank, locked, and active runtime states.
5. Validate the resulting flow against the minimal shared control-plane use cases for showcase-local, VS Code, and MCP.

## Open Questions

- Whether UI reset guidance should link directly to one canonical CLI command or to a short operator runbook with environment-specific variants.
- Whether mutation responses from the shared client should eventually include enough normalized state to reduce follow-up status fetches.
- Whether future multi-client synchronization should prefer polling, file watches, or backend event streams once the base low-level primitives are stable.
