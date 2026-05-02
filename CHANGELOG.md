# Changelog


## [Unreleased] — 2026-05-02
### Changed
- Updated `.changeset/README.md` to clarify changesets purpose and documentation link.
- Adjusted GitNexus metadata in `AGENTS.md` and `CLAUDE.md` to reflect updated symbol, relationship, and flow counts.
- Clarified `docs/README.md` and `docs/STRUCTURE.md` by adding parenthetical context to current and planned structure headings.
- Marked ADR-0001 as "Implemented" in `docs/adr/0001-build-stack.md`.
- Refined framework design principles in `docs/architecture/framework-design-principles.md` to specify conditional imports only when truly necessary.
- Expanded `infrastructure/secrets/README.md` to explicitly list prohibited content types.
- Updated `infrastructure/secrets/policies/access.md` to specify "operation type" in least-privilege access model.

## [Unreleased] - 2026-05-02
### Changed
- Updated symbol count from 4365 to 4664 and relationship count from 7478 to 8008 in GitNexus index metadata
- Changed recommended CLI command from `pnpm exec gitnexus analyze` to `npx gitnexus analyze`



## [Unreleased]
### Added
- `llm:test-upkeep` script to run LLM test upkeep via `@cfxdevkit/llm-tools`

## [Unreleased]
### Changed
- Updated `zod` dependency from `4.3.6` to `3.25.76` in `pnpm-lock.yaml` for root and dev dependencies, reversing previous version conflicts.
- Migrated `lemonade-cli.mjs` and `llm-agents.mjs` scripts to use TypeScript workers (`lemonade-cli.ts` and `llm-agents.ts`) and execute via `pnpm exec tsx` instead of direct Node execution.
- Added `tsx` as a direct dependency in root importers and removed it from devDependencies in `pnpm-lock.yaml`.
### Fixed
- Resolved dependency version mismatch between `zod@4.3.6` and `zod@3.25.76` in `viem` and `wagmi` transitive dependencies.



## [Unreleased] - 2026-05-02
### Changed
- Moved LLM CLI functionality from `scripts/lemonade-cli.mjs` and `scripts/llm-agents.mjs` to a new `@cfxdevkit/llm-tools` package under `repos/cfx-tools/packages/llm-tools`.
- Updated root `package.json` to delegate all `llm:*` scripts to `pnpm --filter @cfxdevkit/llm-tools llm --`, including new commands: `architecture`, `docs-upkeep`, `health`, `plan`, `test-audit`, and `validation`.
- Removed `@mariozechner/pi-coding-agent` from root `devDependencies` and `pnpm-lock.yaml`, as it is now a dependency of `@cfxdevkit/llm-tools`.
- Added `repos/cfx-tools/packages/llm-tools` to `.moon/workspace.yml`.
- Simplified `scripts/lemonade-cli.mjs` to a thin wrapper that spawns the new worker script in `@cfxdevkit/llm-tools`.
- Updated dependency versions in `pnpm-lock.yaml`, notably aligning `zod` to `4.3.6` in some lock entries and removing `bufferutil`/`utf-8-validate` from `@xcfx/node` and `cive` optional dependencies.

## [Unreleased]
### Added
- Added `@mariozechner/pi-coding-agent@^0.72.0` as a dev dependency.
### Changed
- Updated `vite`, `vite-plugin-dts`, and `vitest` to include `yaml@2.8.4` as a transitive dependency in multiple packages.
- Updated `viem` and `wagmi` in `showcase-browser` and `showcase-ui` to use `zod@3.25.76` instead of `zod@4.3.6`.
- Updated `@xcfx/node` and `cive` in `devnode` to include `bufferutil`, `utf-8-validate` peer dependencies.
- Reverted `zod` version in `showcase-browser` and `showcase-ui` from `4.3.6` to `3.25.76` for `viem` and `wagmi`.



## [Unreleased] - 2026-05-02

### Changed
- Reorganized `commit` pipeline into six phases: **Quality gates**, Preflight, Scope detection, Changelog generation, Commit message, and Commit
- Added `QUALITY_GATES` configuration with configurable lint, typecheck, build, and test gates
- Introduced new flags: `--force`, `--skip-checks`, `--with-build`, `--with-tests`
- Quality gates now run before preflight; lint and typecheck are required by default; build and test are opt-in
- Gates support timeouts and non-fatal failure handling (non-required gates do not abort commit)
- Added `runQualityGates()` function with detailed output formatting and gate summary extraction (Moon/Biome)

## [2026-05-02] - Changed

- **`scripts/lemonade-cli.mjs`**: Refactored `runCommit` to implement a 5-phase workflow: Preflight checks, scope detection, per-scope changelog generation (serial), commit message generation, and final commit execution. Added support for `--dry-run`, `--yes`, `--model`, and `--quick` flags. Introduced scope-aware changelog updates with automatic insertion into `CHANGELOG.md` files. Added interactive confirmation before committing unless `--yes` is provided.


All notable changes to this package are documented here.

