## Context

The current shared runtime in `repos/cfx-tools/packages/devnode-server` is the best reusable backend surface in the repository: it already powers showcase-local through thin adapters and includes richer keystore account management, reveal flows, session-key support, and backend extension hooks. The missing pieces are the backend-owned behaviors that already exist in devkit-workspace: persisted local/public network profiles, deterministic signer resolution for public operations, durable wallet-scoped contract storage, and Core/eSpace funding parity.

This change is cross-cutting because it affects backend state management, deploy and contract flows, account funding, API capabilities, and the client surfaces consumed by showcase, VS Code, and MCP. The design therefore centers on pulling the operational backend model from devkit-workspace into the shared runtime without inheriting product-specific concerns such as the Express shell, DEX routes, static hosting, or UI assumptions.

## Goals / Non-Goals

**Goals:**
- Make the shared runtime the canonical backend for local devnode and public-network workflows.
- Persist network profile and tracked-contract state per active wallet so backend behavior survives restarts and wallet switching.
- Support backend-owned deploy and tracked contract calls on local, testnet, and mainnet for both Core Space and eSpace.
- Add Core Space funding parity to the backend accounts surface.
- Preserve the framework runtime’s existing keystore, reveal, session-key, and extension capabilities.

**Non-Goals:**
- Rebuild the devkit-workspace Express server shell inside the shared runtime.
- Port DEX-specific runtime routes, websocket eventing, or static UI hosting as part of this change.
- Replace the current generic address-plus-ABI contract routes with tracked-contract-only flows.
- Redesign showcase-local UI behavior in this change.

## Decisions

### Decision: Keep the shared Hono runtime as the canonical backend core
The implementation SHALL extend `@cfxdevkit/devnode-server` instead of adopting devkit-workspace backend wholesale.

Rationale:
- The shared runtime already matches the desired architecture: backend-first, reusable, and consumer-agnostic.
- It already contains capabilities missing in devkit-workspace, especially keystore account operations and session-key flows.
- Porting behaviors into the canonical runtime avoids long-term divergence between showcase, VS Code, and MCP backends.

Alternatives considered:
- Make devkit-workspace backend canonical: rejected because it would require re-porting richer framework keystore and session-key capabilities back into that codebase.
- Keep both backends feature-divergent: rejected because network and deployment semantics would keep drifting.

### Decision: Introduce wallet-scoped backend network profiles
The runtime SHALL store a persisted network profile for the active wallet, including mode (`local` or `public`), public RPC URLs, and effective chain IDs.

Rationale:
- Deploy, contract calls, and funding need a single backend-owned source of truth.
- Wallet-scoped persistence matches the existing requirement that wallet selection changes local chain data paths and operational context.
- Consumers can query capabilities without inferring behavior from individual routes.

Alternatives considered:
- Keep passing network fields independently to deploy and contract routes: rejected because it leaves backend behavior fragmented and hard to reason about.
- Store one global profile for the whole runtime: rejected because it conflicts with wallet-scoped data and active-wallet switching.

### Decision: Port signer resolution policy into the shared runtime
Public-mode write operations SHALL resolve signers in a deterministic order: environment override, request override, then active-keystore account.

Rationale:
- This matches the operational flexibility already proven in devkit-workspace.
- It lets MCP, VS Code, and showcase use the same backend behavior instead of each inventing its own signer policy.
- It preserves a backend-first model where the backend owns how writes are authorized.

Alternatives considered:
- Require request private keys for all public writes: rejected because it would weaken reuse and prevent keystore-backed flows.
- Allow each consumer to choose signer resolution policy: rejected because it breaks backend consistency.

### Decision: Replace in-memory contract tracking with wallet-scoped persistent storage
Tracked deployments and registered contracts SHALL be stored in a wallet-scoped persistent registry that records address, chain family, network mode, chain ID, deployer, ABI, constructor args, and signer metadata.

Rationale:
- Public-network operations are not usable if tracked contracts disappear on backend restart.
- Wallet scoping avoids leaking contract lists across unrelated mnemonic contexts.
- Tracked contract metadata is required to support consistent id-based reads and writes.

Alternatives considered:
- Keep the existing in-memory registry and rely on consumers to persist state: rejected because it undermines the shared backend model.
- Persist only local deployments: rejected because public-network parity is a goal of this change.

### Decision: Preserve existing generic contract and keystore surfaces while adding tracked-contract orchestration
The runtime SHALL add durable tracked-contract orchestration without removing the current generic address-plus-ABI operations or richer keystore routes.

Rationale:
- Existing consumers already rely on the current shared runtime surface.
- The task is to reach operational parity with devkit-workspace, not regress reusable capabilities.
- Generic ABI operations remain useful for advanced or exploratory flows.

Alternatives considered:
- Collapse all operations into tracked-contract-only APIs: rejected because it would remove useful current behavior.

## Risks / Trade-offs

- [Network profile becomes inconsistent with active wallet state] → Load profile on active-wallet changes and default to a safe local profile when no persisted profile exists.
- [Public signer selection is surprising or unsafe] → Expose signer source in backend responses and document precedence explicitly.
- [Persistent contract registry breaks existing consumers] → Keep current response shapes compatible where possible and add tracked metadata without removing existing fields.
- [Core funding implementation differs from eSpace timing] → Use explicit confirmation polling and chain-specific transfer helpers.
- [Porting too much devkit-workspace product code into the shared runtime] → Limit the change to reusable control-plane behavior and exclude DEX, static hosting, and product shell concerns.

## Migration Plan

1. Add file-backed wallet-scoped persistence primitives for network profile and contract registry.
2. Update shared runtime initialization to load persisted wallet context from the active keystore wallet.
3. Refactor `/network`, `/deploy`, `/contracts`, and `/accounts` to use the new backend-owned context.
4. Extend the client and showcase-local adapters to consume any new response fields and tracked-contract flows.
5. Add focused tests for local/public switching, signer resolution precedence, contract persistence, and Core/eSpace funding.
6. Rollback strategy: revert to the prior in-memory contract registry and simple network state if regressions appear before release.

## Open Questions

- Whether public-mode RPC configuration should remain fully manual or also expose named presets for mainnet and testnet.
- Whether tracked contract IDs should stay backend-generated or allow stable user-provided aliases in the canonical API.
- Whether auth, websocket eventing, and other devkit-workspace operational shell features should be proposed as a separate follow-up change.