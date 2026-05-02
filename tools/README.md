# tools/  — Shared developer tooling (current state)

Configuration and small scripts shared by every package and project. All packages here are dev-dependencies only and consumed via workspace dependencies, never imported at runtime.

## Contents

| Folder | Scope |
|--------|-------|
| `tsconfig/` | Base `tsconfig.json` files (library, app, node, dom) |
| `biome-config/` | Shared Biome configuration |
| `codegen/` | Wagmi codegen, ABI extraction, hardware diagram codegen wrappers |
| `moon-config/` | Shared Moon task templates |

## Rules

- Everything here is a dev-dependency only.
- Consumed by every workspace package, regardless of whether the package lives in `repos/cfx-*` or `projects/*`.
- Changes here should keep the current modular workspace layout in mind; these are cross-cutting helpers, not Tier 0 runtime packages.
