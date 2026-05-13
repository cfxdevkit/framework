# cfx-config

Cross-cutting build configuration packages for the monorepo.

## Packages

| Package | Purpose |
|---|---|
| `tsconfig` | Shared TypeScript configuration presets |
| `biome-config` | Shared Biome formatter and linter configuration |
| `moon-config` | Shared Moon task templates |

These packages are private and dev-only. They may be consumed from any architectural tier as `devDependencies`, but they are not runtime dependencies.
