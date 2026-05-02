# Changelog

## [Unreleased] - 2026-05-02
### Changed
- Removed `compiler` and `contracts` from `cfx-core` slice description in `repos/README.md`.
- Renamed `framework/*` package references to `@cfxdevkit/*` scope across `cfx-core` packages.
- Updated scope descriptions for `protocol` and `testing` packages to clarify tooling/consumer use and test-only nature.
- Corrected relative path references to `ARCHITECTURE.md` and `STRUCTURE.md` files in `cfx-domain` packages.
- Removed non-existent `projects/electro/apps/firmware/` references from `cfx-domain/hardware-bridge` documentation.
- Added explicit test-only disclaimers to `@cfxdevkit/testing` package documentation.
- Exported `ParsedArgs` interface, `parseArgs`, and `printHelp` from `cfx-core/packages/core/cli.ts` to enable external reuse and testing.
- Updated CLI entrypoint to use `pathToFileURL` and `import.meta.url` for safe detection of direct execution.
- Added new test files: `cli.test.ts`, `errors.test.ts`, `index.test.ts`, and `core/src/index.test.ts` to improve test coverage.
- Updated `executor` package documentation to reference `@cfxdevkit/automation` instead of `domains/automation`.
- Fixed relative path to `ARCHITECTURE.md` in `automation/API.md`, `game-engine/API.md`, and `hardware-bridge/API.md`.
- Corrected trailing slash in `hardware-bridge/README.md` for firmware path reference.
- Added hardware-specific driver implementations disclaimer to `hardware-bridge` documentation.
- Updated `game-engine/STRUCTURE.md` to reference project-specific rules layout via correct relative path to `projects/chainbrawler/packages/game-rules/STRUCTURE.md`.
- Adjusted `protocol` package documentation to emphasize read-and-narrow-write scope and clarify sub-path naming.
- Updated `testing` package documentation to explicitly state test-only usage and production tree-shaking behavior.
- Corrected `core/API.md` PORTING.md symbol mapping reference formatting.
- Removed duplicate changelog entry block in `cfx-core/CHANGELOG.md`.
- Removed non-existent firmware path references from `hardware-bridge/README.md` and `hardware-bridge/STRUCTURE.md`.
- Updated `automation/API.md` and `game-engine/API.md` to reference correct relative `ARCHITECTURE.md` path.
- Updated `game-engine/STRUCTURE.md` to reference correct relative path for project-specific rules layout.
- Updated `hardware-bridge/API.md` to reference correct relative `ARCHITECTURE.md` path.
- Updated `cfx-keys/README.md` with updated service package list.
- Updated `cfx-domain/CHANGELOG.md` to reflect firmware path reference removals.


All notable changes to this package are documented here.

