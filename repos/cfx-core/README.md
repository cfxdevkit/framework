# cfx-core

**Tier 0a — chain primitives.** Carve-out target per
[ADR-0003](../../docs/adr/0003-multi-repo-split.md).

## Packages

| Package | npm | Surface |
|---------|-----|---------|
| `core` | `@cfxdevkit/core` | types, errors, chains, units, client, wallet primitives |
| `protocol` | `@cfxdevkit/protocol` | Conflux protocol bindings |
| `contracts` | `@cfxdevkit/contracts` | shared ABIs + deployments |
| `compiler` | `@cfxdevkit/compiler` | solc + revive bridge |
| `executor` | `@cfxdevkit/executor` | tx submission + receipt handling |
| `devnode` | `@cfxdevkit/devnode` | local devnet harness |
| `testing` | `@cfxdevkit/testing` | shared test fixtures |

## Why standalone

Chain primitives change rarely, support window is long, and their dep tree
is small (`viem`, `cive`, `@scure/*`). Splitting them out lets every other
slice pin a stable version and decouples their release cadence.

## Boundaries

- **MUST NOT** depend on `cfx-keys`, `cfx-ui`, `cfx-domain`, or `cfx-tools`.
- **MAY** depend on third-party crypto libs (`@noble/*`, `@scure/*`, `viem`,
  `cive`).
- All packages publish typed entrypoints + sourcemaps.
