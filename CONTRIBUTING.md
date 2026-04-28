# Contributing

## Where does new code go?

Use this decision tree:

```
Is the code reusable across ≥ 2 projects?
├── No  → projects/<project>/...
└── Yes → Is it chain/SDK-level (no domain logic)?
         ├── Yes → framework/<package>/
         └── No  → Is it a developer-experience tool?
                  ├── Yes → platform/<tool>/
                  └── No  → domains/<vertical>/
```

## Tier ownership

| Tier | Code review required from |
|------|---------------------------|
| framework/ | Framework maintainer (semver gatekeeper) |
| platform/  | Platform maintainer |
| domains/   | Domain owner (per package) |
| projects/  | Project lead |
| infrastructure/ | DevOps / SRE |
| tools/, docs/ | Anyone, with one approval |

## Conventions

- **Language:** TypeScript strict everywhere except firmware (`projects/electro/apps/firmware/` — C++).
- **Style:** Biome, config in `tools/biome-config/`.
- **Commits:** Conventional Commits.
- **Branches:** trunk-based, short-lived feature branches.
- **PR scope:** one tier per PR; cross-tier changes require explicit justification.

## Adding a new package

1. Create folder under the appropriate tier.
2. Add a README.md describing scope, public API, and dependencies.
3. Register in the root `pnpm-workspace.yaml`.
4. Inherit `tsconfig` from `tools/tsconfig/`.
5. If publishable, add changeset config and CI publish hook.

## Adding a new project

1. Create `projects/<name>/` with sub-folders: `apps/`, `packages/` (optional), `contracts/` (optional), `README.md`.
2. Add `infrastructure/<name>/` for deploy artefacts.
3. Add CI workflow under `.github/workflows/<name>.yml`.
4. Document in [docs/projects/](docs/projects/).
