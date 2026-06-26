## Why

The CLI package currently fails validation due to import ordering violations and missing/extra imports, causing `lint` and `check` commands to report errors. Resolving these discrepancies is necessary to restore CI validation health and ensure the package adheres to the project's standardized code quality rules.

## What Changes

- Reorder import statements in the CLI package to comply with linter configuration rules.
- Add missing flag extraction imports (`deriveFromFlags`, `generateFromFlags`) required by CLI commands.
- Remove or relocate unused/extra imports (`statusFromFlags`, `chainFromFlags`, `addressFromFlags`, `keystoreFromFlags`) that violate the current import diff expectations.
- Ensure the `cli` package passes both `pnpm run lint` and `pnpm run check` without errors or warnings.

## Capabilities

### New Capabilities
- `fix-cli-lint-imports`: Standardize import ordering and resolve missing/extra imports in the CLI package to satisfy lint and check validation rules.

### Modified Capabilities
- None

## Impact

- **Code:** `cli` package source files (import statements only).
- **Build/CI:** Resolves `devnode-server:lint` and `cli:lint` error signals; unblocks `wallet:build` and overall validation pipeline.
- **Dependencies/APIs:** No external dependencies or public APIs are modified. Changes are strictly internal to the CLI package's module structure.
