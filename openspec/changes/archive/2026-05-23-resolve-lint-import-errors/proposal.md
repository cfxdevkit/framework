## Why

Lint errors in the `repo-check` command module indicate missing or incorrect imports—specifically for `runStructuredRepoCommand`, `findWorkspaceRoot`, `getGitNexusSnapshot`, and `writeJson`. These errors prevent successful linting and checking, causing cascading failures in CI and local development workflows. Resolving them is critical to restore correctness and reliability in the repo-check pipeline before further development or deployment.

## What Changes

- Fix missing or misdirected imports in `repo-check` command module:
  - Import `runStructuredRepoCommand` from `./commands.js`
  - Import `findWorkspaceRoot`, `getGitNexusSnapshot`, and `writeJson` from `./context.js`
- Ensure all imports resolve to correct modules and types (e.g., `RepoCheckHotspotsResult`, `RepoCheckKebabGroupsResult`)
- Restore lint and check phase compatibility without altering runtime behavior or public APIs

## Capabilities

### New Capabilities
- `resolve-lint-import-errors`: A capability to detect and remediate import-related lint errors in command modules, ensuring correct module resolution and preventing cascading failures in lint and check phases.

### Modified Capabilities
None.

## Impact

- **Affected code**: `src/commands/repo-check/index.ts` (or equivalent entry point)
- **Dependencies**: Internal modules `./commands.js`, `./context.js`, `./hotspots.js`, `./kebab-groups.js`
- **Systems**: CI lint/check pipeline, local `pnpm run lint` and `pnpm run check` workflows
- **Breaking changes**: None—this change only corrects import paths and does not modify exported APIs or behavior.
