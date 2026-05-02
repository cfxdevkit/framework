# Changelog

## [2026-05-02] - Changed

- **`scripts/lemonade-cli.mjs`**: Refactored `runCommit` to implement a 5-phase workflow: Preflight checks, scope detection, per-scope changelog generation (serial), commit message generation, and final commit execution. Added support for `--dry-run`, `--yes`, `--model`, and `--quick` flags. Introduced scope-aware changelog updates with automatic insertion into `CHANGELOG.md` files. Added interactive confirmation before committing unless `--yes` is provided.


All notable changes to this package are documented here.

