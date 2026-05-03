# Changelog


## 2026-05-03
### Changed
  - Fixed relative links in `README.md` to point to the correct ADR location.
  - Updated links in `framework/core/API.md` to use explicit 'see' references for design principles and error model documentation.
  - Corrected path reference in `framework/core/PORTING.md` to point to the architecture documentation.
  - Clarified description of strategy definitions in `framework/executor/API.md` to specify they are in `@cfxdevkit/automation`.
  - Revised documentation in `framework/protocol/API.md` to better describe the scope of read-and-narrow-write operations.

## [Unreleased] - 2026-05-02
- Exported `ParsedArgs` interface, `parseArgs`, and `printHelp` from `cli.ts` to enable external reuse and testing.
- Updated CLI entrypoint to use `pathToFileURL` and `import.meta.url` for safe detection of direct execution, preventing unintended `main()` invocation during module imports.
- Added new test files: `cli.test.ts`, `errors.test.ts`, `index.test.ts`, and `core/src/index.test.ts` to improve test coverage.
- Renamed `framework/*` packages to `@cfxdevkit/*` scope in API and documentation references.
- Updated README and STRUCTURE links across `executor`, `protocol`, and `testing` packages to point to explicit `README.md` and `STRUCTURE.md` files.
- Adjusted scope descriptions for `protocol` and `testing` to emphasize tooling/consumer use and test-only nature respectively.
- Clarified `@cfxdevkit/executor` strategies are defined in `@cfxdevkit/automation`.
- Updated `@cfxdevkit/protocol` API documentation to reflect read-and-narrow-write scope and correct sub-path references.
- Updated `@cfxdevkit/testing` documentation to explicitly state test-only usage and production tree-shaking behavior.



## [Unreleased] - 2026-05-02
### Changed
- Renamed `framework/core`, `framework/protocol`, `framework/testing`, and `framework/executor` packages to `@cfxdevkit/*` scope in API and documentation references.
- Updated `defineChain` documentation to clarify it validates and registers chain configs instead of being a pure identity validator.
- Marked `signerFromPrivateKey` as `@deprecated` in `framework/core` with guidance to use `framework/wallet/signers` in production.
- Clarified `framework/devnode` node lifecycle is managed via `createNode` and `stop`.
- Added optional `seed` parameter to `createDevWorld` in `framework/testing` for deterministic test setup.
- Updated README and STRUCTURE links across `executor`, `protocol`, and `testing` packages to point to explicit `README.md` and `STRUCTURE.md` files.
- Adjusted scope descriptions for `protocol` and `testing` to emphasize tooling/consumer use and test-only nature respectively.

## [Unreleased] - 2026-05-02
### Changed
- Exported `ParsedArgs` interface, `parseArgs`, and `printHelp` from `cli.ts` to enable external reuse and testing.
- Updated CLI entrypoint to use `pathToFileURL` and `import.meta.url` for safe detection of direct execution, preventing unintended `main()` invocation during module imports.
- Added new test files: `cli.test.ts`, `errors.test.ts`, `index.test.ts`, and `core/src/index.test.ts` to improve test coverage.


All notable changes to this package are documented here.

