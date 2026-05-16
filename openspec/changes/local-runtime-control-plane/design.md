## Context

The repo already has the skeleton of the right architecture:

- `repos/cfx-tools/packages/devnode-server` provides a reusable Hono runtime shell
- `repos/cfx-tools/packages/client` provides a typed consumer surface
- showcase-local, the VS Code extension, and MCP all need broadly the same backend capabilities

What is still missing is not the idea of a shared backend. It is the full contract and the extension model.

Today the fragmentation is still visible in three places:

- showcase-local still owns compile, session-key, and deploy logic in app-local Next handlers
- the VS Code extension still owns important runtime, keystore, and contract logic directly
- MCP still carries a direct-package story that conflicts with a canonical reusable backend contract and a shared orchestrated state model

## Goals / Non-Goals

**Goals:**
- One canonical backend contract for network, node lifecycle, keystore, wallet roots, derived accounts, active account selection, reveal flows, funding, contracts, compiler/templates, session-key flows, deploy/interact flows, and custom project operations
- One typed client surface that mirrors the runtime contract for browser clients, extensions, and MCP integrations
- Backend-owned account logic so account selection and signer resolution are reusable and programmatic
- Explicit route-extension hooks so projects can attach custom backend functionality without forking core runtime services
- One orchestrated state model that can be fetched consistently by showcase-local, the VS Code extension, MCP, and users
- A standalone service/CLI layer over the same services

**Non-Goals:**
- Forcing every consumer onto HTTP if an in-process adapter is materially better
- Introducing a remote, shared, multi-user backend service
- Treating showcase-local-specific UI decisions as core backend concerns

## Architecture Shape

```text
Consumers
	├─ showcase-local browser UI
	├─ VS Code extension
	└─ MCP handlers / tools
					│
					▼
Shared command model
	├─ HTTP via @cfxdevkit/client
	└─ matching in-process adapter
					│
					▼
Local runtime control plane
	├─ network service
	├─ node controller + profiles
	├─ keystore service
	├─ wallet/account service
	├─ contract registry + interaction service
	├─ compiler/template service
	├─ session-key service
	└─ custom route attachment point
```

## Decisions

### 1. The control plane is command-complete, not just lifecycle-complete
**Decision:** The shared runtime surface must cover the operations that real consumers need, not only node lifecycle. That includes wallet roots, derived accounts, reveal flows, account activation, contract interaction, compiler/template flows, session keys, and deploy/import behavior.  
**Rationale:** A partial backend still forces each consumer to rebuild missing slices.

### 2. Backend owns account state and signer selection
**Decision:** Account derivation, active account selection, signer resolution, and protected secret reveal all belong to backend services. Consumers send intent; they do not duplicate account logic.  
**Rationale:** This is required for reuse across browser UI, extension UI, and MCP tools.

### 3. `@cfxdevkit/devnode-server` remains the reusable transport shell
**Decision:** The runtime is still built around `@cfxdevkit/devnode-server`, but it must expose more route families and clearer service boundaries.  
**Rationale:** The package already has the right transport shape and route composition model.

### 4. Custom backend extension is a first-class feature
**Decision:** The runtime app should allow projects to attach custom routes or route groups with access to shared runtime services.  
**Rationale:** Downstream projects need to implement custom operations without moving business logic into a UI layer.

### 5. The typed client mirrors the route model
**Decision:** `@cfxdevkit/client` should grow alongside the backend surface so HTTP consumers do not invent ad hoc request helpers per app.  
**Rationale:** Typed client parity is what makes the backend reusable in practice.

### 6. Consumers may differ in transport, not semantics
**Decision:** The VS Code extension and MCP may choose HTTP or a matching in-process adapter, but the visible operations, payload shapes, status semantics, and orchestrated state model must stay aligned with the canonical runtime contract. Shared-backend orchestration is the default direction because it is easier to keep extension, MCP, showcase, and user-observed state in sync.  
**Rationale:** Different transports are acceptable; different backend models and unsynchronized state owners are not.

### 7. CLI and service entrypoints are thin wrappers over the same services
**Decision:** A standalone process mode and CLI commands should reuse the same runtime services and route semantics instead of introducing a second orchestration path.  
**Rationale:** Operational tooling should strengthen the shared contract, not bypass it.

## Risks / Trade-offs

- **There is still consumer debt:** the extension and MCP have existing direct-package assumptions. The backend contract will need an explicit migration path rather than a flag day.
- **A complete contract is broader than the current server surface:** filling the missing operations is real backend work, not just documentation alignment.
- **Custom extension hooks can become unstable if service boundaries are unclear:** the extensibility API needs a deliberate, typed shape rather than exposing raw internals casually.

## Migration Plan

1. Finalize the command families and typed client namespaces
2. Move remaining showcase-local runtime logic into the shared control plane
3. Add route-extension hooks and one demonstrator custom operation that returns the current block number
4. Align the showcase UI to the completed backend surface
5. Refactor the VS Code extension and MCP onto the shared contract or a matching in-process adapter that preserves the same orchestrated state model
6. Keep the CLI/service layer thin over the same services