## Context

The repository uses `@cfxdevkit/tooling-cli` (package name, `cdk` binary) as a 50-command dispatcher across 7 namespaces: `repo`, `agent`, `llm`, `docs`, `devnode`, `sign`, `signer`. This dispatcher **calls moon** (backwards wiring), creating three entry points for repo operations (`pnpm run build`, `cdk repo build`, `pnpm run check`). The `cdk llm` namespace has 20+ deprecated hidden commands. LLM operations are scattered across `cdk agent`, `cdk llm`, `cdk docs enrich`, and `cdk repo review`. Moon already handles 30 packages with a deterministic task graph but isn't the entrypoint for CLI commands.

## Goals / Non-Goals

**Goals:**
- Establish `moon run` as the single entrypoint for all repository-wide operations and LLM-based workflows.
- Narrow `cdk` binary to ~20 framework-scoped commands only (build, test, lint, contracts, devnode, sign, signer, MCP, derivation, chain status, deterministic docs).
- Remove `cdk repo`, `cdk agent`, `cdk llm` namespaces entirely from the binary.
- Remove all 20+ deprecated hidden `cdk llm:*` commands.
- Add moon task definitions for every removed command.
- Remove backwards wiring (moon tasks call `cdk` → moon tasks call libraries directly).
- Keep package name `@cfxdevkit/tooling-cli`, binary name `cdk` unchanged.

**Non-Goals:**
- Migrate standalone CLIs (`cfx`, `cfxdevkit-devnode`, `cfxdevkit-mcp`) into `cdk` or moon. They remain independently callable.
- Change moonrepo configuration (toolchain.yml, workspace.yml schema).
- Replace clipanion CLI framework in `tooling-cli`.
- Change `@cfxdevkit/cdk` (RPC client library at `repos/cfx-core/packages/cdk/`).
- Modify `@cfxdevkit/cli` (`cfx` binary at `repos/cfx-tools/packages/cli/`).
- Modify CI/CD GitHub Actions workflows (migration is out of scope).

## Decisions

**1. `moon run` as single entrypoint**
- **Decision**: All repo operations, LLM operations, agent sessions, and cross-package workflows are accessible via `moon run <task>`.
- **Rationale**: moon already handles the 30-package task graph, parallelism, caching, and dependency resolution. It is the natural single entrypoint. `cdk repo build` calling `moon run :build` is backwards — moon should call libraries directly.
- **Alternatives Considered**: Keep `cdk` as dispatcher calling moon. Rejected — backwards wiring, unnecessary abstraction layer, three entry points.

**2. `cdk` binary scoped to framework operations**
- **Decision**: `cdk` keeps only commands that developers run directly against framework packages: `build [pkg]`, `test [pkg]`, `lint [pkg]`, `contracts extract`, `devnode`, `sign`, `signer`, `mcp start`, `derive`, `generate-mnemonic`, `status`, `docs generate/validate`.
- **Rationale**: Developers working on framework packages need quick one-off commands. These are framework-scoped, not repo-scoped.
- **Alternatives Considered**: Remove `cdk` entirely. Rejected — framework developers need a direct CLI for quick operations. Merge `cdk` into moon. Rejected — moon is a task runner, not an interactive CLI.

**3. No package rename**
- **Decision**: `@cfxdevkit/tooling-cli` keeps its package name. Binary remains `cdk`.
- **Rationale**: `@cfxdevkit/cdk` already exists as a core library (RPC client, contracts, addresses). Renaming would break imports. The package is private anyway; consumers use the `cdk` binary, not the package name.
- **Alternatives Considered**: Rename to `@cfxdevkit/cli-tools`. Rejected — adds complexity for no benefit. The binary name `cdk` is what users interact with.

**4. Moon tasks as wrapper layer (Phase 1) → direct calls (Phase 3)**
- **Decision**: Phase 1 moon tasks call `cdk` commands (compatibility layer). Phase 2 slims `cdk`. Phase 3 replaces moon→cdk wiring with direct library calls.
- **Rationale**: Provides a migration path. Users can adopt `moon run repo:build` alongside `cdk repo build` during Phase 1. Phase 3 completes the consolidation by removing the intermediary.
- **Alternatives Considered**: Immediate replacement. Rejected — too many breaking changes at once. Gradual approach allows CI migration in separate PRs.

**5. Standalone CLIs remain independent**
- **Decision**: `cfx`, `cfxdevkit-devnode`, `cfxdevkit-mcp`, `scaffold-cli`, `cfx-docs-pipeline`, `cfxdevkit-extract-contracts`, `cas-setup` remain independently callable binaries. moon tasks wrap them but they are not merged into `cdk`.
- **Rationale**: These are published packages with independent consumers. Merging them into `cdk` or `moon` would break their standalone usage. moon tasks provide a convenient wrapper without requiring the binaries to be part of the `cdk` dispatcher.
- **Alternatives Considered**: Merge all standalone CLIs into `cdk`. Rejected — breaking change for published package consumers, increases `cdk` scope again.

## Risks / Trade-offs

[Risk] CI/CD pipelines using `cdk repo` or `cdk agent` commands will break during Phase 2. → [Mitigation] Phase 1 compatibility layer (`moon run repo:*` → `cdk repo:*`) gives CI scripts time to migrate. GitHub Actions workflows are explicitly out of scope — they will be migrated in a follow-up change.

[Risk] Removing `cdk llm` namespace breaks any scripts referencing `cdk llm:*`. → [Mitigation] All `cdk llm:*` commands are already `hidden: true` and redirect to `cdk agent:*`. Zero public usage expected. Phase 0 removal is safe.

[Risk] moon task definitions increase maintenance surface. → [Mitigation]: Tasks are thin wrappers (one-liners) calling existing CLI code. The consolidation actually reduces maintenance by eliminating the dispatcher layer.

[Trade-off] Developers familiar with `cdk repo build` must learn `moon run :build` or `moon run repo:build`. → [Mitigation] `moon run :build` is shorter than `cdk repo build`. Root `package.json` scripts maintain `pnpm run build` as a convenience alias.

## Migration Plan

### Phase 0: Cleanup (no breaking changes)
1. Delete `tooling-cli/src/llm/namespace.ts` and `tooling-cli/src/llm/` directory
2. Remove `llmToolingNamespace` import and registration from `tooling-cli/src/registry.ts`
3. Remove `cdk llm` from `toolingNamespaces` array
4. Update help text in `tooling-cli/src/run.ts`

### Phase 1: Moon task definitions (compatibility layer)
5. Add `repo:*` tasks to `tooling-cli/moon.yml` (calls `cdk repo *`)
6. Add `agent:*` tasks to `tooling-cli/moon.yml` (calls `cdk agent *`)
7. Add `docs:*` tasks to `tooling-cli/moon.yml` (calls `cdk docs *`)
8. Add `devnode:*` tasks to `devnode/moon.yml` (wraps `cfxdevkit-devnode`)
9. Add `sign:*`/`signer:*` tasks to `signer-session/moon.yml` (wraps signing CLI)
10. Add `scaffold:*` tasks to `scaffold-cli/moon.yml` (wraps `scaffold-cli`)
11. Add `contracts:extract` task to `codegen-contracts/moon.yml` (wraps extraction CLI)
12. Add `mcp:*` tasks to `mcp-server/moon.yml` (wraps MCP server binary)
13. Add `cas:setup` task to `cas-setup/moon.yml` (wraps CAS setup CLI)
14. Add `arch-check` task to `arch-check/moon.yml` (calls tsx directly)
15. Update root `package.json` scripts to use `moon run` for repo operations

### Phase 2: Slim `cdk` to framework scope
16. Remove `repoToolingNamespace` from `registry.ts`
17. Remove `agentToolingNamespace` from `registry.ts`
18. Remove `devnodeToolingNamespace` from `registry.ts`
19. Remove `signToolingNamespace` from `registry.ts`
20. Remove `signerToolingNamespace` from `registry.ts`
21. Remove `docsEnrichmentCommands` and LLM docs commands from `registry.ts`
22. Keep only framework-scoped commands: build, test, lint, typecheck, check, generate, contracts, devnode, sign, signer, mcp, derive, generate-mnemonic, status, docs generate/validate
23. Update `formatToolingHelp()` to reflect new slim scope

### Phase 3: Remove backwards wiring
24. Replace `moon run repo:build` → direct `moon run :build` call
25. Replace `moon run repo:gate` → direct `moon run :gate:*` call
26. Replace `moon run agent:chat` → direct PI agent call
27. Replace `moon run docs:enrich` → direct docs-pipeline call
28. Replace `moon run devnode:start` → direct devnode CLI call
29. Replace `moon run sign:message` → direct signing CLI call
30. Replace `moon run scaffold:new` → direct scaffold-cli call
31. Verify all moon tasks work independently of `cdk` binary

## Open Questions

- Should `cdk devnode` subcommands (`start`, `stop`, `status`) coexist with `moon run devnode:*`? (Yes — `cdk devnode` serves developers running dev node locally; `moon run devnode:start` serves CI and team workflows.)
- Should `cdk docs generate/validate` coexist with `moon run docs:*`? (Yes — `cdk docs` serves framework developers; `moon run docs` serves CI and team workflows.)
