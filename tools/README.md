# tools/  — Shared developer tooling

Configuration and small scripts shared by every package and project.

## Contents

| Folder | Scope |
|--------|-------|
| `tsconfig/` | Base `tsconfig.json` files (library, app, node, dom) |
| `biome-config/` | Shared Biome configuration |
| `eslint-config/` | (legacy projects only) shared ESLint config |
| `release/` | Changesets config, release scripts, npm publish helpers |
| `codegen/` | Wagmi codegen, ABI extraction, hardware diagram codegen wrappers |
| `git-hooks/` | Pre-commit / commit-msg enforcement (incl. secret scanning) |

## Rules

- Everything here is a dev-dependency only.
- Versioned alongside framework but consumed by every workspace.
