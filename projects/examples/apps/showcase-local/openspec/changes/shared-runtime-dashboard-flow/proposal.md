## Why

The reusable backend in `@cfxdevkit/devnode-server` now has the right overall shape, but the full keystore-to-runtime lifecycle is still fragmented across the backend, the shared client package, and showcase-local app-specific fetch wrappers. That fragmentation makes the current showcase-local UI feel like a disconnected capability dump instead of a real dashboard, and it keeps the shared client from being the single source of truth for VS Code, MCP, and showcase consumers.

The next step is not a product-specific UI polish pass. It is to make the backend and the shared client functionally complete for the real control-plane flow: initialize or unlock a keystore, manage wallet roots and derived accounts, drive backend-owned network state, operate the local node when needed, compile and deploy contracts, and keep multiple clients in sync against the same running backend.

This change also addresses an operational gap in the current lifecycle: if a user forgets the keystore passphrase, the system has no clear blank-state recovery path. The desired model is a full reset back to a blank state, but exposed as a CLI/operator action with explicit UI instructions instead of as an in-app destructive HTTP route.

## What Changes

- Define a complete backend keystore lifecycle that cleanly distinguishes blank state, locked state, unlocked state, and active-wallet state, including a documented full reset path that clears keystore and runtime state through CLI/operator workflows.
- Align the shared `@cfxdevkit/client` package with the backend control-plane surface so wallet-root and derived-account operations, active wallet/account reads, network state, and node operations use one canonical client contract.
- Remove showcase-local reinvention of backend client semantics and make it consume the shared low-level client primitives instead of maintaining parallel route vocabulary and fetch wrappers.
- Redesign showcase-local around a dashboard-style lifecycle: guided keystore onboarding, unlock-or-reset entry, backend-owned network selection, local node controls when local mode is active, combined editor/compiler/deploy workspace, wallet management, and a contained operation log/footer.
- Preserve backend-owned network state as the source of truth for all runtime operations so showcase, VS Code, and MCP can operate concurrently against the same backend without semantic drift.
- Keep wallet and account terminology strict and shared across backend and client surfaces: a wallet is a mnemonic root, and an account is a derived index under that wallet that yields both Core and eSpace addresses.

## Capabilities

### New Capabilities
- `backend-keystore-lifecycle`: Model the full keystore lifecycle for blank, locked, unlocked, and active-wallet states, and define the operator-facing full reset path that returns the system to a blank state.
- `shared-runtime-client`: Provide a canonical low-level client surface for the reusable backend so showcase-local, VS Code, and MCP consumers share the same control-plane semantics.
- `showcase-runtime-dashboard`: Present the reusable backend flow as a dashboard-style guided workspace instead of a flat collection of disconnected panels.

### Modified Capabilities
- `backend-network-profiles`: Clarify that backend-owned network selection is the canonical runtime state used by all consumers and all operations, not a consumer-local preference.

## Impact

- Affected code: `repos/cfx-tools/packages/devnode-server`, `repos/cfx-tools/packages/client`, showcase-local runtime adapters and workspace UI, and operator/user-facing run guidance.
- Affected APIs: shared client namespaces for keystore, node, network, and related runtime state reads; showcase-local app routes that currently proxy or rename backend semantics.
- Affected systems: showcase-local, VS Code extension, MCP server, and any future local app integrations that need to attach to the same backend process and stay in sync.
- Operational impact: the backend reset flow will be documented and surfaced as UI guidance, but the destructive reset itself remains a CLI/operator action rather than a passwordless HTTP route.
- UX impact: showcase-local will move from an always-visible option matrix to a lifecycle-driven dashboard that reveals capabilities when the backend state makes them actionable.
