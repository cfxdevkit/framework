# Contributing

## Where does new code go?

Use this decision tree:

```
Is the code reusable across ≥ 2 projects?
├── No  → projects/<project>/...
└── Yes → Is it chain/SDK-level (no domain logic)?
         ├── Yes → repos/cfx-{core,keys,ui,solidity}/packages/<package>/
         └── No  → Is it a developer-experience tool?
                  ├── Yes → repos/cfx-tools/packages/<tool>/ or repos/cfx-tools/devtools/<tool>/
                  └── No  → repos/cfx-domain/packages/<vertical>/
```

The `framework/`, `platform/`, and `domains/` names are still useful as
architectural tiers, but the current workspace is organized under `repos/cfx-*`
plus `projects/*`.

## Tier ownership

| Tier | Code review required from |
|------|---------------------------|
| Tier 0 (`repos/cfx-core`, `repos/cfx-keys`, `repos/cfx-ui`, `repos/cfx-solidity`) | Framework maintainer (semver gatekeeper) |
| Tier 1 (`repos/cfx-tools`) | Platform maintainer |
| Tier 2 (`repos/cfx-domain`) | Domain owner (per package) |
| projects/  | Project lead |
| infrastructure/ | DevOps / SRE |
| tools/, docs/ | Anyone, with one approval |

## Conventions

- **Language:** TypeScript strict everywhere except the checked-in electro firmware surface under `projects/electro/` (C++).
- **Style:** Biome, config in `repos/cfx-config/packages/biome-config/`.
- **Commits:** Conventional Commits.
- **Branches:** trunk-based, short-lived feature branches.
- **PR scope:** one tier per PR; cross-tier changes require explicit justification.

## Adding a new package

1. Create folder under the appropriate tier.
2. Add a README.md describing scope, public API, and dependencies.
3. If the package is a reusable library or tool surface, also add `STRUCTURE.md` and `API.md`.
4. If the package is config-only, document the exported files in its README and API doc.
5. If the directory is an app or a slice root, README coverage is sufficient unless that unit exposes a documented library API.
6. Register in the root `pnpm-workspace.yaml`.
7. Register the package in `.moon/workspace.yml`.
8. Inherit `tsconfig` from `repos/cfx-config/packages/tsconfig/`.
9. If publishable, add changeset config and CI publish hook.

## Adding a new project

1. Create `projects/<name>/` with sub-folders: `apps/`, `packages/` (optional), `contracts/` (optional), `README.md`.
2. Add `infrastructure/<name>/` for deploy artefacts.
3. Add CI workflow under `.github/workflows/<name>.yml`.
4. Document the new project in [projects/README.md](projects/README.md).
