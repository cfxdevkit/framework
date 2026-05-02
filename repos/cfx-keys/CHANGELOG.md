# Changelog


## [Unreleased]
### Changed
- Updated capability assertion error message to use `shortHex` for truncated address display
- Refactored `rawSignatureToHex` to use new `signaturePart` helper for consistent r/s validation and formatting
- Added `signaturePart` function to enforce 32-byte hex string requirement with clearer error messages
- Updated `finaliseEip1559Tx` to use `signaturePart` for r/s serialization and ensure lowercase hex output

## [Unreleased] - 2026-05-02
### Changed
- Renamed `framework/wallet` to `@cfxdevkit/wallet` in API.md, README.md, and STRUCTURE.md headers and metadata.
- Updated dependency references from `framework/core` and `framework/services` to `@cfxdevkit/core` and `@cfxdevkit/services` in README.md and STRUCTURE.md.
- Updated example `socketPath` comment in services/API.md to use backticks for clarity.


All notable changes to this package are documented here.

