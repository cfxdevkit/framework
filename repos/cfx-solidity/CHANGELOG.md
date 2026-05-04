# Changelog


## 2026-05-04

### Changed

- Updated repos/cfx-solidity files: repos/cfx-solidity/CHANGELOG.md, repos/cfx-solidity/packages/contracts/src/deploy/index.ts, repos/cfx-solidity/packages/contracts/src/deploy/core.ts, repos/cfx-solidity/packages/contracts/src/deploy/espace.ts, repos/cfx-solidity/packages/contracts/src/deploy/types.ts.

## 2026-05-04

### Changed

- Updated repos/cfx-solidity files: repos/cfx-solidity/packages/contracts/src/deploy/index.ts, repos/cfx-solidity/packages/contracts/src/deploy/core.ts, repos/cfx-solidity/packages/contracts/src/deploy/espace.ts, repos/cfx-solidity/packages/contracts/src/deploy/types.ts.



## 2026-05-04

### Changed

- Updated repos/cfx-solidity files: repos/cfx-solidity/packages/compiler/src/solc/compile.ts, repos/cfx-solidity/packages/contracts/src/bridge/index.ts, repos/cfx-solidity/packages/contracts/src/write/index.ts, repos/cfx-solidity/packages/compiler/src/solc/compile-helpers.ts, repos/cfx-solidity/packages/contracts/src/bridge/internals.ts, repos/cfx-solidity/packages/contracts/src/write/core.ts, repos/cfx-solidity/packages/contracts/src/write/espace.ts, repos/cfx-solidity/packages/contracts/src/write/receipt.ts.

## [Unreleased] - 2026-05-02
### Changed
- Renamed `contracts-extract` package from `@cfxdevkit/codegen-contracts` to `@cfxdevkit/contracts-extract` in root README.md
- Clarified `@cfxdevkit/abis` usage scope to include TypeScript-based dApps and tooling in API.md
- Fixed relative path to `contracts` package in `contracts-extract/README.md` from `../../../framework/contracts` to `../../contracts`
- Simplified relative import paths in `contracts/API.md` from `@cfxdevkit/contracts/*` to `./` equivalents for improved tree-shaking guidance
- Corrected path reference to `STRUCTURE.md` in `contracts-extract/README.md` from `../../STRUCTURE.md` to `STRUCTURE.md`



## [Unreleased] - 2026-05-02
### Added
- Added test suite for artifact generation and validation in `compiler/src/artifacts.test.ts`
- Added test suite for compiler error handling in `compiler/src/errors.test.ts`
- Added test suite for dependency resolution logic in `compiler/src/resolver/index.test.ts`
- Added test suite for Solc compilation pipeline in `compiler/src/solc/compile.test.ts`
- Added test suite for Solc integration entrypoints in `compiler/src/solc/index.test.ts`
- Added test suite for Solc binary loading and caching in `compiler/src/solc/loader.test.ts`
- Added test suite for ERC20 template source generation in `compiler/src/templates/erc20/source.test.ts`
- Added test suite for template system in `compiler/src/templates/index.test.ts`
- Added test suite for ABI parsing and validation in `contracts/src/abis/index.test.ts`
- Added test suite for bridge contract interactions in `contracts/src/bridge/index.test.ts`
- Added test suite for deployment orchestration in `contracts/src/deploy/index.test.ts`
- Added test suite for ERC20 contract behavior in `contracts/src/erc20/index.test.ts`
- Added test suite for contract error handling in `contracts/src/errors/index.test.ts`
- Added test suite for read-only contract calls in `contracts/src/read/index.test.ts`
- Added test suite for mock contract utilities in `contracts/src/test/mocks.test.ts`
- Added test suite for write contract interactions in `contracts/src/write/index.test.ts`

## [Unreleased] - 2026-05-02
### Changed
- Renamed `framework/abis` to `@cfxdevkit/abis` in API and STRUCTURE docs.
- Renamed `framework/compiler` to `@cfxdevkit/compiler` in README, API, and STRUCTURE docs.
- Updated `contracts-extract` status from 'scaffold package' to 'experimental'.
- Clarified `contracts` package: removed 'Cive-backed' reference and streamlined description of signing and transaction dispatch.
- Updated `contracts` README to reflect full eSpace and Core Space support instead of eSpace-only.


All notable changes to this package are documented here.

