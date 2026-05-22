## Why

The root package.json has grown a large set of overlapping maintenance scripts that wrap Moon tasks, package CLIs, and one-off commands with inconsistent patterns. That makes command discovery, long-term maintenance, and future TUI integration harder because the root command surface is not typed, namespaced, or machine-readable.

## What Changes

- Introduce a dedicated internal root maintenance CLI that becomes the stable entrypoint for monorepo upkeep and automation workflows.
- Define a shared command registry contract for package-owned tooling CLIs so they expose commands with the same shape, help metadata, and dispatch model.
- Rework root package.json to keep a small stable command surface that forwards into the root maintenance CLI instead of adding one script alias per workflow.
- Preserve a limited set of compatibility aliases during migration, but make them delegate through the new root CLI instead of pointing directly at package internals.
- Add machine-readable command catalog output so a future TUI can discover namespaces, commands, descriptions, and invocation metadata without scraping help text.

## Capabilities

### New Capabilities
- `root-maintenance-cli`: A stable root CLI for monorepo maintenance commands that dispatches namespaced tooling workflows from one entrypoint.
- `tooling-command-registry`: A shared command definition contract that package CLIs publish for root dispatch, help generation, and future TUI integration.

### Modified Capabilities
- None.

## Impact

Affected areas include the root package.json script surface, the existing `@cfxdevkit/llm-tools` and `@cfxdevkit/docs-pipeline` CLIs, and the maintenance-command entrypoints currently exposed through direct root aliases. The change will likely add a new internal tooling package under `repos/cfx-tools/infra/`, introduce shared command metadata/types, and update command documentation for maintainers.