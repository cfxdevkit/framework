## Why

The `keystore.ts` command module has grown to 590 lines, creating a hard hotspot that impedes maintainability, testing, and developer onboarding. Concurrently, `onekey*.ts` files in the signer-session package violate the repository's kebab-case naming convention, triggering CI warnings. Addressing these issues now reduces technical debt, enforces consistent codebase standards, and prevents further architectural degradation.

## What Changes

- Extract sub-commands and shared utilities from `keystore.ts` to reduce its line count below the hard hotspot threshold.
- Rename `onekey*.ts` files in `signer-session/src` to strictly comply with the repository's kebab-case naming conventions.
- Update all internal imports, CLI routing configurations, and test fixtures to reflect the new module structure and file names.

## Capabilities

### New Capabilities
- `refactor-keystore-hotspot-and-naming`: Refactors the monolithic keystore command module into smaller, focused utilities and enforces kebab-case naming conventions for signer-session files.

### Modified Capabilities
None

## Impact

- **Code**: `repos/cfx-tools/packages/cli/src/commands/keystore.ts`, `repos/cfx-keys/packages/signer-session/src/onekey*.ts`
- **Dependencies/Tooling**: CLI command parser, module import resolution, and repository linting/CI checks.
- **Systems**: Developer onboarding workflow, code maintainability, and automated compliance validation.
