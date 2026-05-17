## Context

`apps/showcase-local` no longer needs a chapter-page implementation plan. The product has become a single workspace that should act as a thin client over the shared local runtime control plane.

The remaining design problem is twofold:

- the UI still behaves like a long stack of cards rather than a focused backend-management tool
- the app still owns too much backend logic in Next.js handlers instead of consuming the canonical shared runtime

The user intent is now explicit:

- showcase-local is a local/backend wallet and node management UI
- the browser should contain only essential presentation and orchestration logic
- the command surface should match the needs of the VS Code extension and MCP
- the left side should behave like one unified VS Code-style tree with networks, wallets, accounts, and contracts
- operations should be modal-driven to avoid clutter
- the first pass should already expose the complete agreed operational surface instead of placeholder leaves
- deployed contract tracking is enough for the first pass; manual contract import can follow later
- the showcase should demonstrate both shared operations and one custom operation implemented by extending the backend
- the custom extension example should stay simple: return the current block number from the backend
- deeper faucet UX integration should be explored separately even though account-management logic stays backend-owned

## Goals / Non-Goals

**Goals:**
- One workspace at `/` that presents backend-managed resources through a tree-oriented UI
- One unified tree surface that can share the same resource and command logic as the VS Code extension
- All stateful wallet, account, node, network, contract, compiler, and session-key logic lives in the backend
- Same-origin app routes are thin adapters over the shared runtime control plane
- The command model matches the operational surface of the VS Code extension and the intended MCP tool layer
- Contract tracking is network-aware and space-aware
- A custom backend extension route is demonstrated as an example for downstream projects
- The first implementation pass is feature-complete for the agreed showcase surface rather than a partial skeleton
- Mutation-heavy flows use modal UX so the workspace stays focused and uncluttered

**Non-Goals:**
- Recreating the VS Code extension UI pixel-for-pixel
- Moving the app to a browser-wallet architecture
- Introducing a remote multi-user backend service or auth layer
- Adding application-specific logic to the UI when the same logic belongs in the reusable backend
- Full faucet-in-account-management UX for the browser workspace in this change; that follow-on can be explored separately once the shared backend/account model is finished

## Information Architecture

The workspace should be organized like a backend operations console with one unified tree:

```text
┌────────────────────────────────┬──────────────────────────────────────┐
│ Unified Tree                   │ Main Detail Pane                     │
├────────────────────────────────┼──────────────────────────────────────┤
│ Networks                       │ Selected resource details            │
│  ├─ Local                      │ Status snapshots                     │
│  │   ├─ Node                   │ Contract ABI / balances / metadata   │
│  │   ├─ Wallets                │ Read-only summaries                  │
│  │   │   └─ <wallet>           │ Custom operation examples            │
│  │   │       └─ <account>      │                                      │
│  │   └─ Contracts              ├──────────────────────────────────────┤
│  │       └─ <deployed>         │ Sticky Audit / Event Log             │
│  ├─ Testnet                    │ Shared action history and results    │
│  └─ Mainnet                    │                                      │
└────────────────────────────────┴──────────────────────────────────────┘

Mutating actions open modals anchored to the selected tree item:

- setup / unlock / rotate / reveal
- create / import / rename / delete wallet
- select active account
- start / restart / wipe node
- compile / deploy / call / send
- run custom backend extension action
```

## Decisions

### 1. The showcase UI is one unified tree client, not a sequence of chapter forms
**Decision:** The left rail mirrors the VS Code extension mental model as one unified tree: networks, node controls, wallet roots, derived accounts, and tracked contracts appear as branches and leaves in a single navigation surface.  
**Rationale:** The showcase is meant to expose the same backend-managed operations in a browser form factor. A tree structure makes resource relationships visible and reduces page clutter.

### 2. Backend services own all runtime and account logic
**Decision:** The shared runtime control plane owns network state, node lifecycle, wallet roots, derived accounts, active account selection, contract registry, compiler flows, session-key flows, reveal flows, and faucet funding.  
**Rationale:** The user requirement is explicit: even account logic should live in the backend so consumers can call it programmatically and projects can extend it cleanly.

### 3. Same-origin Next routes stay thin and disposable
**Decision:** The app uses same-origin adapters only where the browser needs them. Those adapters proxy to the shared runtime contract and do not become an independent backend layer.  
**Rationale:** Showcase-local should demonstrate the reusable backend, not compete with it.

### 4. Mutations use modal UX; the main pane is for context and results
**Decision:** Create/import/reveal/deploy/fund/call/send and other mutations open dedicated modals or command sheets. The main pane stays focused on the selected resource and its current state.  
**Rationale:** The current inline-card approach is too chaotic and hides the actual structure of the system.

### 5. The command surface matches extension and MCP needs
**Decision:** The backend contract is designed around reusable resource actions rather than showcase-specific forms. The same command families should be consumable by the VS Code extension tree, the showcase UI, and MCP tools.
**Rationale:** The backend only becomes reusable if the command model is broader than the showcase.

### 6. Backend extensibility is a first-class requirement
**Decision:** Projects should be able to attach their own API routes or route groups to the runtime app and reuse shared services such as controller, keystore, network state, and contract registry. The showcase should include one example custom operation to prove this pattern.  
**Rationale:** The backend is not only for the built-in demo. It should act as an extensible local developer control plane.

### 7. The first showcase pass is complete, not illustrative
**Decision:** The first pass should already expose the complete agreed operational surface instead of placeholder leaves or "coming soon" sections.  
**Rationale:** The showcase is intended to mirror real backend capabilities shared with the extension and MCP, not to sketch them.

### 8. The custom backend example stays intentionally simple
**Decision:** The first demonstrator custom operation is a backend route that returns the current block number.  
**Rationale:** A simple read-only example proves the extension pattern without conflating it with the larger faucet/account-management exploration.

### 9. First-pass contract tracking is limited to deployed contracts
**Decision:** The first pass tracks deployed contracts only. Manual contract import can follow once the backend contract and tree UI are stable.  
**Rationale:** Deployed-contract tracking is enough to prove the environment-aware contract workflow without widening the scope too early.

### 10. Faucet UX is a follow-on exploration
**Decision:** The backend should stay capable of account-related funding logic, but deeper faucet integration inside the account-management UX is not part of this change.  
**Rationale:** It belongs to the broader account-management exploration rather than the first tree-workspace rewrite.

## Risks / Trade-offs

- **Tree complexity can become opaque:** a deep tree can still overwhelm users if labels and modal triggers are inconsistent. Mitigation: keep branches resource-oriented and put mutation verbs in a predictable modal/action layer.
- **Backend parity work is larger than a UI pass:** finishing the UI without moving compile/session/deploy/account flows into the control plane would repeat the same architecture problem. Mitigation: sequence backend completion before or alongside the UI rewrite.
- **VS Code extension and MCP are not fully aligned yet:** both still contain direct-package assumptions today. Mitigation: treat the shared runtime contract as the source of truth and map consumers onto it incrementally.
- **Faucet/account UX can expand scope too early:** account funding belongs to the backend model, but a polished faucet-first UX should not block the main workspace rewrite. Mitigation: keep it as a follow-on exploration.

## Concrete Implementation Shape

The implementation should converge on this architecture:

```text
showcase-local UI
	└─ thin Next adapters
			└─ local runtime control plane
					├─ network service
					├─ node controller + profiles
					├─ keystore + wallet roots + accounts
					├─ contract registry + interaction service
					├─ compiler/template service
					├─ session-key service
					└─ custom route attachment point
```

That same control plane should then be consumable by:

- showcase-local in browser form
- VS Code extension in tree-view form
- MCP as programmatic tools over the same command model
