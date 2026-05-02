# Changelog


## [Unreleased] - 2026-05-02
### Changed
- Exported `ParsedArgs` interface, `parseArgs`, and `printHelp` from `cli.ts` to enable external reuse and testing.
- Updated CLI entrypoint to use `pathToFileURL` and `import.meta.url` for safe detection of direct execution, preventing unintended `main()` invocation during module imports.
- Added new test files: `cli.test.ts`, `errors.test.ts`, `index.test.ts`, and `core/src/index.test.ts` to improve test coverage.

## [Unreleased] - 2026-05-02
### Changed
- Renamed `framework/core`, `framework/protocol`, `framework/testing`, and `framework/executor` packages to `@cfxdevkit/*` scope in API and documentation references.
- Updated `defineChain` documentation to clarify it validates and registers chain configs instead of being a pure identity validator.
- Marked `signerFromPrivateKey` as `@deprecated` in `framework/core` with guidance to use `framework/wallet/signers` in production.
- Clarified `framework/devnode` node lifecycle is managed via `createNode` and `stop`.
- Added optional `seed` parameter to `createDevWorld` in `framework/testing` for deterministic test setup.
- Updated README and STRUCTURE links across `executor`, `protocol`, and `testing` packages to point to explicit `README.md` and `STRUCTURE.md` files.
- Adjusted scope descriptions for `protocol` and `testing` to emphasize tooling/consumer use and test-only nature respectively.


All notable changes to this package are documented here.

