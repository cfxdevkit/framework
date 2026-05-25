## Why

Two packages sit in archive directories inside the monorepo:

- `repos/cfx-tools/packages/archive/cdk-ai/` (`@cfxdevkit/cdk-ai`)
- `repos/cfx-tools/infra/archive/llm-tools/` (`@cfxdevkit/llm-tools`)

Both are `private: true`, have zero live importers, and are picked up by the
`pnpm-workspace.yaml` globs (`repos/*/packages/*` and `repos/cfx-tools/infra/*`).

They exist only as git history artifacts. Keeping them:
- Adds noise to `pnpm install`, `pnpm build`, and `pnpm typecheck` runs
- Pollutes the package graph shown by tooling
- Creates false positives in dependency searches

Git history preserves the code; there is no value in keeping them on disk.

## What Changes

- Delete `repos/cfx-tools/packages/archive/cdk-ai/` (entire directory)
- Delete `repos/cfx-tools/infra/archive/llm-tools/` (entire directory)
- If the `archive/` directories become empty, remove them too

## Capabilities

### New Capabilities

### Modified Capabilities

## Impact

- `repos/cfx-tools/packages/archive/` — deleted
- `repos/cfx-tools/infra/archive/` — deleted
- `pnpm-workspace.yaml` — no change needed (globs simply stop matching)
- No live package loses a dependency
