## 1. Root Dispatcher Setup

- [x] 1.1 Create the new `repos/cfx-tools/infra/tooling-cli` package scaffold with package metadata, build config, and a thin bin entrypoint.
- [x] 1.2 Add a minimal root package.json entrypoint that forwards to `@cfxdevkit/tooling-cli` and establish the initial root help command.

## 2. Shared Command Contract

- [x] 2.1 Define shared command descriptor, namespace registry, and runner types for package-owned tooling surfaces.
- [x] 2.2 Implement root CLI help, machine-readable catalog output, and namespaced dispatch based on the shared registry.
- [x] 2.3 Add unit tests for command registration, catalog generation, and delegated exit-code handling.

## 3. First Namespace Migrations

- [x] 3.1 Adapt `repos/cfx-tools/infra/llm-tools` to expose its command registry through the shared contract without changing command ownership.
- [x] 3.2 Refactor `repos/cfx-tools/packages/docs-pipeline` to expose its commands through the shared registry and runner pattern.
- [x] 3.3 Register initial `llm` and `docs` namespaces in the root dispatcher and verify equivalent command execution through the root CLI.

## 4. Root Script Cleanup And Migration

- [x] 4.1 Replace direct root maintenance wrappers with dispatcher-based scripts and keep only explicitly chosen compatibility aliases.
- [x] 4.2 Document the new root command pattern, alias migration policy, and catalog usage for future TUI work.
- [x] 4.3 Validate the migrated surface with focused builds/tests plus representative root command invocations for `llm` and `docs` workflows.