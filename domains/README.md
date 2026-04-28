# domains/  — Tier 2: Reusable Vertical Domains

Encapsulates **one vertical concern** that has been validated as reusable
(used by ≥ 2 projects, or explicitly designated as a future product).

## Promotion criteria

A folder under a project graduates here when:

1. A second project needs the same logic, **or**
2. The owner formally promotes it to a reusable domain library.

Until then, the code lives inside the originating project.

## Domains

| Domain | Scope | Origin |
|--------|-------|--------|
| [game-engine/](game-engine/) | Generalised on-chain game state machine, turn engine, action dispatch | extracted from `chainbrawler/packages/core` |
| [automation/](automation/) | Strategy library: limit orders, DCA, scheduled txs, conditions | extracted from `cas/conflux-cas/worker` |
| [hardware-bridge/](hardware-bridge/) | WS protocol, sensor type system, hardware diagram codegen | extracted from `Electro/packages/{ws-protocol,sensor-types,hardware-diagram}` |

## Rules

- Each domain is one or more npm packages with their own README + tests.
- Imports `framework/*` only.
- Public API documented in package README.
- Versioned independently from framework.
