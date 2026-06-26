## Why

The `kebab-groups` validation check is currently flagging `onekey*.ts` files in the `signer-session` package for violating kebab-case naming conventions. This inconsistency triggers linting warnings and deviates from project-wide standards. Resolving this now ensures the `cfx-keys` package aligns with established naming rules and clears automated validation errors.

## What Changes

- Rename `onekey*.ts` files in `repos/cfx-keys/packages/signer-session/src` to strictly follow kebab-case: `onekey-diagnostics.ts` and `onekey-session.ts`.
- Update all internal imports and module references to match the newly renamed files.
- No functional behavior, public APIs, or runtime logic is altered; this is a structural and naming remediation.

## Capabilities

### New Capabilities
- `cfx-keys-kebab-renames`: Standardizes file naming conventions within the `cfx-keys` signer-session package to enforce kebab-case compliance and resolve linting violations.

### Modified Capabilities
- None

## Impact

- Internal file structure and import paths within `repos/cfx-keys/packages/signer-session/src`.
- Build tooling and module resolvers will need to recognize the renamed files.
- No external APIs, dependencies, or runtime behavior are affected. Only internal module resolution is updated.
