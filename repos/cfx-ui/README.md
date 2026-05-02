# cfx-ui

**Tier 0c — React UI surface.** Carve-out target per
[ADR-0003](../../docs/adr/0003-multi-repo-split.md).

This folder contains packages that provide React-based UI surface for the
`@cfxdevkit/*` stack. Packages are published as scoped npm modules and
consumed by apps in `projects/` and external consumers.

## Packages

| Package | npm | Surface |
|---------|-----|---------|
| `react` | `@cfxdevkit/react` | hooks, providers, primitives |
| `defi-react` | `@cfxdevkit/defi-react` | DeFi widgets (swap, lend, stake) |
| `theme` | `@cfxdevkit/theme` | design tokens + Tailwind preset |
| `wallet-connect` | `@cfxdevkit/wallet-connect` | WalletConnect v2 adapter |

## Why standalone

UI moves fastest (weekly releases). Coupled to `cfx-core` and `cfx-keys`
through stable npm ranges, so chain code is not blocked by UI iteration.

## Boundaries

- **MAY** depend on `@cfxdevkit/core`, `@cfxdevkit/wallet`.
- **MUST NOT** depend on `cfx-domain`, `cfx-tools`.
- React + Tailwind allowed; no chain-primitive duplication.
