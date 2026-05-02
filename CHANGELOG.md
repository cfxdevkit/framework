# Changelog


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

