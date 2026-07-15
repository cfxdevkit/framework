## Why

The CLI `keystore.ts` file has grown to 590 lines, triggering a hard complexity hotspot that impedes maintainability, increases bug risk, and violates project complexity thresholds. Concurrently, the `signer-session` package contains files with kebab-case naming warnings (`onekey*.ts`), creating inconsistency with established project conventions. Addressing these issues now prevents technical debt accumulation, ensures linting and complexity checks pass, and streamlines future development without disrupting build pipelines.

## What Changes

- Refactor `repos/cfx-tools/packages/cli/src/commands/keystore.ts` to split logic, reduce cyclomatic complexity, and bring line count below the hard hotspot threshold.
- Rename `onekey-diagnostics.ts` and `onekey-session.ts` in `repos/cfx-keys/packages/signer-session/src` to comply with kebab-case naming conventions.
- Update internal import statements and module references to reflect the new file names.
- No changes to public APIs, external dependencies, or runtime behavior.

## Capabilities

### New Capabilities
- `reduce-cli-hotspot-and-naming`: Addresses CLI complexity hotspot and enforces kebab-case naming conventions in the signer-session package.

### Modified Capabilities
- None

## Impact

- **Code:** `repos/cfx-tools/packages/cli/src/commands/keystore.ts`, `repos/cfx-keys/packages/signer-session/src/`
- **APIs/Dependencies:** No external API or dependency changes. Only internal module resolution and import paths are updated.
- **Systems/Pipelines:** Resolves hard hotspot and kebab-group lint warnings, ensuring CI validation passes. Build and test pipelines remain unaffected.
