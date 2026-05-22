## Context

The current root command surface mixes several different patterns:
- direct Moon passthrough commands such as `build`, `lint`, and `check:*`
- package CLI passthrough commands such as `llm:*` and `docs:*`
- one-off helpers such as `showcase` and `devnode`

This has created a root package.json with a large number of duplicated wrappers whose behavior is spread across multiple packages and hand-maintained aliases. There is already evidence of a reusable CLI pattern in the repo: `@cfxdevkit/llm-tools` uses a typed command registry plus a thin `runCli` wrapper, while `@cfxdevkit/docs-pipeline` and other packages still expose their commands through bespoke switch logic or direct script aliases.

The next phase should stabilize the maintenance surface without collapsing all tooling into one package. Each tool should keep ownership of its own behavior, but expose command metadata and a consistent runner contract so a root CLI and future TUI can compose them.

## Goals / Non-Goals

**Goals:**
- Create one stable root entrypoint for monorepo maintenance and automation flows.
- Standardize how package-owned tooling CLIs describe commands, help text, and dispatch behavior.
- Reduce root package.json maintenance-script sprawl by routing through namespaced root CLI commands.
- Make the command surface machine-readable so a future TUI can enumerate and execute supported workflows.
- Allow incremental migration so existing flows remain usable while command ownership is cleaned up.

**Non-Goals:**
- Replace the public `@cfxdevkit/cli` package used for end-user chain tooling.
- Merge all existing tooling implementations into a single monolith package.
- Rewrite Moon tasks or app-specific dev scripts that are not part of the maintenance CLI unification phase.
- Deliver the future TUI in this phase; this phase only establishes the command contract it will consume.

## Decisions

### 1. Add a dedicated internal root dispatcher package
Create a new internal package, `@cfxdevkit/tooling-cli`, under `repos/cfx-tools/infra/`, and make it the owner of the root maintenance command surface.

Rationale:
- The root package.json is not a typed integration surface and cannot serve as a durable command API.
- Extending the public `@cfxdevkit/cli` package would mix end-user developer tooling with internal monorepo-maintenance concerns.
- Keeping the dispatcher internal preserves freedom to evolve the maintenance surface without changing the published public CLI contract.

Alternative considered:
- Extend `@cfxdevkit/cli`: rejected because it serves a different audience and already has a focused chain-tooling scope.
- Keep the logic in root scripts: rejected because scripts are not introspectable or reusable by a TUI.

### 2. Use a shared command registry contract across package CLIs
Participating package CLIs will expose structured command definitions instead of only hardcoded help text and switch statements. The registry should capture, at minimum, namespace, command name, description, argument/help metadata, and how the command is executed.

Rationale:
- The root dispatcher needs a stable integration point that does not depend on scraping help text.
- The future TUI needs machine-readable command metadata.
- `@cfxdevkit/llm-tools` already demonstrates that a registry-driven pattern is practical in this repo.

Alternative considered:
- Parse package help text at runtime: rejected because it is brittle and cannot carry typed argument metadata reliably.
- Force every tool into a shared implementation library immediately: rejected because it increases migration cost and would conflate ownership.

### 3. Migrate package CLIs incrementally and keep compatibility aliases temporarily
The first migration wave should cover the root-maintenance commands that already have CLI ownership or clear command grouping, starting with `llm-tools` and `docs-pipeline`, then moving arch-check and other maintenance wrappers. Root aliases may remain temporarily, but they should delegate through the new root CLI rather than directly into package internals.

Rationale:
- This reduces breakage while shrinking duplicated root logic.
- It gives maintainers time to update habits and documentation.
- It lets the team move high-value namespaces first instead of blocking on full convergence.

Alternative considered:
- Remove all old aliases in one step: rejected because it is risky and creates avoidable churn.

### 4. Keep command ownership with the tool package; keep orchestration at the root
The root CLI should register namespaces and delegate to package-owned runners. It should not absorb the behavior of docs sync, LLM upkeep, or other domain-specific workflows. Where a tool does not yet have a package CLI, the root CLI may wrap an existing Moon task or bin temporarily, but the long-term goal is package-owned command modules.

Rationale:
- Tool packages remain the source of truth for their own behavior.
- The root CLI stays thin and focused on composition, discovery, and stable routing.
- This keeps the migration aligned with the typed docs-pipeline direction already established.

## Risks / Trade-offs

- Command aliases will exist in two places during migration -> Mitigation: make root package.json aliases delegate only to the new root CLI and document the deprecation boundary.
- Adding another internal package increases indirection -> Mitigation: keep the root CLI thin, registry-driven, and limited to composition rather than business logic.
- Some current maintenance flows are Moon tasks rather than package CLIs -> Mitigation: allow temporary root wrappers, but require a namespace contract so they can later move behind package-owned runners.
- A shared registry can become too abstract if it tries to model every possible flag shape up front -> Mitigation: start with a minimal command descriptor needed for dispatch, help, and catalog output, then extend only when real consumers require it.

## Migration Plan

1. Create `@cfxdevkit/tooling-cli` with a namespaced root command surface and catalog/help output.
2. Define shared command descriptor and runner types that participating tooling packages can export.
3. Migrate `@cfxdevkit/llm-tools` to expose its existing registry through the shared contract.
4. Refactor `@cfxdevkit/docs-pipeline` from manual subcommand mapping to the shared registry contract.
5. Add root package.json entrypoints that forward to `@cfxdevkit/tooling-cli`, and convert selected compatibility aliases to delegate through it.
6. Document the new invocation pattern and mark deprecated aliases.
7. In a follow-up phase, migrate additional maintenance surfaces such as arch-check wrappers and any remaining direct script aliases.

## Open Questions

- Should arch-check get its own package CLI namespace in this phase, or should the root dispatcher wrap Moon tasks until a later cleanup phase?
- Should the shared command catalog be built from runtime imports only, or should the repo also emit a generated JSON manifest artifact for external consumers?
- How many root compatibility aliases should remain after the first migration pass versus being removed immediately once docs are updated?