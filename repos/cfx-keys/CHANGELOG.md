# Changelog

## 2026-05-04

### Changed

- Updated repos/cfx-keys files: repos/cfx-keys/packages/services/API.md, repos/cfx-keys/packages/services/package.json, repos/cfx-keys/packages/services/src/keystore/index.ts, repos/cfx-keys/packages/services/vite.config.ts, repos/cfx-keys/packages/wallet/API.md, repos/cfx-keys/packages/wallet/STRUCTURE.md, repos/cfx-keys/packages/wallet/package.json, repos/cfx-keys/packages/wallet/src/errors/index.ts, repos/cfx-keys/packages/wallet/src/hardware/index.ts, repos/cfx-keys/packages/wallet/src/hardware/types.test.ts, repos/cfx-keys/packages/wallet/src/hardware/types.ts, repos/cfx-keys/packages/wallet/vite.config.ts, and 13 more.



## 2026-05-04

### Changed

- Updated repos/cfx-keys files: repos/cfx-keys/CHANGELOG.md, repos/cfx-keys/packages/services/src/crypto/index.ts, repos/cfx-keys/packages/services/src/crypto/aead.ts, repos/cfx-keys/packages/services/src/crypto/constants.ts, repos/cfx-keys/packages/services/src/crypto/encoding.ts, repos/cfx-keys/packages/services/src/crypto/errors.ts, repos/cfx-keys/packages/services/src/crypto/kdf.ts, repos/cfx-keys/packages/services/src/crypto/keys.ts, repos/cfx-keys/packages/services/src/crypto/random.ts.

## 2026-05-04

### Changed

- Updated repos/cfx-keys files: repos/cfx-keys/packages/services/src/crypto/index.ts, repos/cfx-keys/packages/services/src/crypto/aead.ts, repos/cfx-keys/packages/services/src/crypto/constants.ts, repos/cfx-keys/packages/services/src/crypto/encoding.ts, repos/cfx-keys/packages/services/src/crypto/errors.ts, repos/cfx-keys/packages/services/src/crypto/kdf.ts, repos/cfx-keys/packages/services/src/crypto/keys.ts, repos/cfx-keys/packages/services/src/crypto/random.ts.



## 2026-05-04

### Changed

- Updated repos/cfx-keys files: repos/cfx-keys/packages/services/src/keystore/file/index.ts, repos/cfx-keys/packages/wallet/src/hardware/onekey/index.ts, repos/cfx-keys/packages/wallet/src/hardware/satochip/index.ts, repos/cfx-keys/packages/services/src/keystore/file/internals.ts, repos/cfx-keys/packages/wallet/src/hardware/onekey/helpers.ts, repos/cfx-keys/packages/wallet/src/hardware/satochip/helpers.ts.

## [Unreleased] — 2026-05-02
### Changed
- Renamed `framework/services` to `services` in API documentation headers.
- Simplified section headings (e.g., `services/keystore` → `keystore`) by removing redundant `services/` prefix.
- Updated error code prefixes (e.g., `services/keystore/locked` → `keystore/locked`) to reflect simplified module paths.
- Marked ADR-0002 as not yet created in README.md to clarify status of future packages.
### Removed
- `framework/` prefix from all public API section titles and error code namespaces.



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

