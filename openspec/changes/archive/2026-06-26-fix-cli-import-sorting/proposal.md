## Why

The CLI module currently violates ESLint's `import/order` rules due to unsorted command imports. This causes persistent lint errors in `devnode-server:lint` and build failures in `wallet:build`, blocking CI/CD pipelines and reducing code consistency. Standardizing the import order resolves these violations and ensures the codebase adheres to established linting standards.

## What Changes

- Reorder CLI command imports alphabetically to satisfy ESLint `import/order` rules.
- Resolve `devnode-server:lint` and `wallet:build` errors caused by import sorting violations.
- No functional or API changes; purely a code style and linting fix.

## Capabilities

### New Capabilities
- `fix-cli-import-sorting`: Standardizes ESLint import ordering for CLI command modules to resolve lint and build failures.

### Modified Capabilities
- None

## Impact

- Affects CLI command import statements and ESLint validation pipelines.
- Unblocks `devnode-server:lint` and `wallet:build` CI/CD signals.
- No changes to public APIs, dependencies, or runtime behavior.
