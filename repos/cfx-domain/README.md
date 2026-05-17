# cfx-domain

**Tier 2 — vertical concerns.** Carve-out target per
[ADR-0003](../../docs/adr/0003-multi-repo-split.md).

## Packages

| Package | npm | Consumers |
|---------|-----|-----------|
| `game-engine` | `@cfxdevkit/game-engine` | conflux-phaser, chainbrawler |
| `automation` | `@cfxdevkit/automation` | cas, electro |

Each vertical may eventually move to its own repo. Start as one repo; split when
a second consumer arrives.

## Boundaries

- **MAY** depend on `@cfxdevkit/core`, `@cfxdevkit/wallet`.
- **MUST NOT** depend on `cfx-ui` or `cfx-tools`.
