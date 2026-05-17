# Proposal: examples-showcase-local

> Closure note (2026-05-17): Archive this change as materially implemented. The workspace-style `showcase-local` app landed; the remaining cleanup and validation work now lives in `artifacts/plan/phase-1-showcase-local.md` instead of this older change set.

## Why

The current showcase-local OpenSpec artifacts describe an older product: five separate chapter pages for a local-only demo. The implementation and the product direction have already moved past that shape.

The actual target product is a backend-management workspace:

- the UI is a client of the local runtime backend, not a second backend implementation
- the command surface should match the operations needed by showcase-local, the VS Code extension, and MCP
- the left side should behave like one unified VS Code-style tree for network selection, wallet and account management, and contract tracking so the same logic can be reused across consumers
- mutating operations should open modal flows instead of filling the page with inline forms
- the first pass should already implement the complete agreed operational surface rather than placeholder branches or partial demos
- the first pass should track deployed contracts only; deeper contract import workflows can follow later
- the showcase should demonstrate both the shared runtime operations and one simple project-defined custom operation extending the backend
- MCP should align with the same shared backend contract because orchestrated backend state is easier to keep in sync across extension, MCP, showcase, and user-driven workflows

The current UI is still structurally chaotic and the OpenSpec docs are now stale. This change rewrites the specification around the intended backend-first product and a full UI rewrite.

## What Changes

- Replace the chapter-first product definition with one workspace at `/` that acts as a local/backend wallet and node management client
- Rewrite the UI/UX around a tree-structured command surface on the left and a focused detail pane on the right
- Keep essential logic in the backend: network state, node lifecycle, wallet roots, derived accounts, active signer/account selection, contract tracking, compiler/deploy/session flows, and secret reveal flows
- Reduce the Next.js app to thin same-origin adapters and presentation logic where browser access requires it
- Align the showcase command surface with the VS Code extension's operational model and the MCP model built on the same backend contract
- Demonstrate backend extensibility by including one custom project operation exposed as an attached API route and callable both from the UI and programmatically; the first example is a simple current-block-number action

## Updated Capabilities

- `showcase-local-chapters`: retained capability name, but now defines the single workspace UI instead of separate chapter pages
- `showcase-local-api`: thin app adapters over the shared runtime control plane, plus any showcase-specific extension routes

## Dependencies

- Depends on: `examples-shared-foundation` for the existing app shell and UI package
- Depends on: `local-runtime-control-plane` for the canonical backend contract and reusable runtime services
- Mirrors: the VS Code extension command surface for network, wallet, account, node, and contract operations
- Prepares parity with: MCP runtime handlers so the showcase reflects the same backend-owned capabilities that agents will call programmatically
