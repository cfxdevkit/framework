# CDK CLI Refactor Plan

## Goal

Create a single repository control-plane CLI named `cdk` that becomes the default
entrypoint for deterministic maintenance, validation, generation, review, and
LLM-assisted enrichment flows.

The intent is to replace the current fragmented surface made of:

- root `package.json` aliases such as `docs:*`, `llm:*`, `check:*`, `gen:*`, `sync:*`
- the namespace router in `@cfxdevkit/tooling-cli`
- deterministic command dispatch in `@cfxdevkit/docs-pipeline`
- worker-launching dispatch in `@cfxdevkit/llm-tools`
- direct worker CLIs under `llm-agents`

The target state is one coherent command model with one help surface, one command
catalog, one alias strategy, and one ownership model.

## Proposed Naming

- Root binary: `cdk`
- Root script prefix: `cdk:*`
- Compatibility binary during migration: keep `cfx-tooling` temporarily
- Package name recommendation:
  - keep `@cfxdevkit/tooling-cli` as the implementation package, or
  - rename it later to `@cfxdevkit/cdk-cli`

Do not rename the existing package ecosystem around `@cfxdevkit/cdk` just to fit the
CLI name. The executable name and command taxonomy are the important unification step.

## Current Fragmentation

### 1. Multiple entry surfaces

Current operations are split across:

- `pnpm run tooling -- ...`
- `pnpm run llm:*`
- `pnpm run docs:*`
- `pnpm run check:*`
- `pnpm run gen:*`
- package-local CLIs and worker scripts

This makes repository operations discoverable only if the user already knows which
package owns which command family.

### 2. Mixed orchestration layers

Docs operations are currently composed in multiple places:

- deterministic docs sync and validation live in `docs-pipeline`
- LLM docs enrichment lives in `llm-agents`
- root docs orchestration lives in `tooling-cli`
- some hybrid flows already call deterministic steps internally from `llm-agents`

As a result, the same concern is split by implementation style instead of user intent.

### 3. Shell-launch indirection

`llm-tools` is mostly a worker launcher. It maps commands to worker scripts, then spawns
`pnpm exec tsx ...` into another process. This adds duplication in:

- command registration
- help text
- dispatch logic
- error handling
- compatibility aliases

### 4. Inconsistent ownership model

Some commands are grouped by technology rather than by task:

- `llm commit` is really a repository operation
- `llm review` is deterministic review logic
- `docs enrich ...` is user-oriented, but implemented as a root shim that chains two packages

## Refactor Objectives

1. Make `cdk` the default entrypoint for all repository tooling.
2. Group commands by user task area rather than by implementation package.
3. Keep deterministic and LLM-assisted flows in the same command family where they operate on the same domain.
4. Remove process-spawn indirection for normal CLI operation where possible.
5. Preserve backward compatibility during migration.
6. Keep domain packages modular even if the command surface becomes unified.

## Target Command Taxonomy

### Top-level areas

- `cdk docs ...`
- `cdk repo ...`
- `cdk llm ...`
- optional later: `cdk project ...`, `cdk release ...`, `cdk wiki ...`

### `cdk docs`

Use for all documentation operations, deterministic and enriched.

Examples:

- `cdk docs sync all`
- `cdk docs sync packages`
- `cdk docs validate content`
- `cdk docs validate wiki`
- `cdk docs enrich api`
- `cdk docs enrich readme`
- `cdk docs enrich structure`
- `cdk docs enrich packages`
- `cdk docs enrich content`
- `cdk docs probe api`
- `cdk docs review`

Rule:

- `sync` and `validate` are deterministic
- `enrich`, `probe`, and `review` are hybrid or LLM-aware
- all docs help, aliases, and flags are defined in one command tree

### `cdk repo`

Use for repository maintenance, validation, generation, and commit workflow.

Examples:

- `cdk repo check hotspots`
- `cdk repo check docs`
- `cdk repo check ci`
- `cdk repo check secrets`
- `cdk repo check corpus`
- `cdk repo check eval`
- `cdk repo generate api`
- `cdk repo generate readme`
- `cdk repo generate structure`
- `cdk repo arch-check`
- `cdk repo review`
- `cdk repo precommit`
- `cdk repo commit`

Rule:

- repository intent owns the command family even when an LLM is involved
- `review`, `precommit`, and `commit` move out of the `llm` namespace

### `cdk llm`

Use for provider/model administration and general-purpose repo-aware LLM utilities.

Examples:

- `cdk llm models`
- `cdk llm validate-models`
- `cdk llm config`
- `cdk llm ask`
- `cdk llm actions`
- `cdk llm action <name>`

Rule:

- `llm` owns model, provider, and generic agent interaction concerns
- domain-specific flows should live under the domain, not under `llm`

## Ownership Model

### `tooling-cli`

Becomes the single command graph and orchestration surface.

Owns:

- command taxonomy
- help text
- command catalog
- aliases and deprecations
- shared flag parsing conventions
- top-level orchestration across packages

Does not own:

- docs generation logic
- arch-check business rules
- LLM runtime/provider logic

### `docs-pipeline`

Remains the deterministic docs engine.

Owns:

- sync
- validate
- package discovery for docs surfaces
- deterministic generated-content repair

Exports handlers directly for `cdk docs sync|validate ...`.

### `arch-check`

Remains the deterministic repository validation and generation engine.

Owns:

- repository checks
- API/README/STRUCTURE generation
- architecture validation contracts

Exports handlers directly for `cdk repo check ...` and `cdk repo generate ...`.

### `llm-agents`

Remains the hybrid and LLM-assisted automation layer.

Owns:

- LLM-backed docs enrichment
- repo review/commit suggestions
- test upkeep
- hybrid docs upkeep flows

Exports callable handlers rather than depending on worker-specific CLI entrypoints.

### `llm-client`

Remains the provider/runtime layer only.

Owns:

- providers
- transport
- model discovery and completion
- shared client configuration

No user-facing command taxonomy should be defined here.

### `llm-tools`

Recommended end state:

- reduce to compatibility shim, or
- remove entirely after migration

Its current command registry and worker-spawn dispatch should not remain the primary CLI layer.

## Architectural Direction

### From namespace router to command graph

Current root CLI behavior is namespace-oriented:

- choose namespace
- forward command
- let sub-package define the rest

Target behavior is command-graph oriented:

- one canonical typed registry
- areas, verbs, targets, aliases, and handlers described in one place
- one help surface for the whole repo
- one machine-readable catalog

### From spawned workers to direct handler calls

Current LLM path:

- root namespace
- `llm-tools`
- spawned `tsx` worker CLI
- `llm-agents`

Target path for normal operation:

- `cdk` command graph
- direct handler invocation
- package-local logic runs in-process

Thin compatibility scripts may remain temporarily, but not as the main execution path.

### From implementation grouping to intent grouping

Current grouping answers: which package owns this?

Target grouping answers: what is the user trying to do?

This is the main UX shift.

## Migration Phases

### Phase 0: Taxonomy and compatibility map

Deliverables:

- complete command inventory of existing root scripts and package CLIs
- mapping table from old commands to new `cdk` commands
- final decision on top-level areas: `docs`, `repo`, `llm`
- explicit deprecation policy and timeline

Output:

- typed command mapping doc
- implementation checklist

### Phase 1: Introduce `cdk` without behavior change

Deliverables:

- add `cdk` binary to the root tooling package
- keep existing `tooling` and `cfx-tooling` compatibility entrypoints
- update root package scripts to expose `cdk` aliases alongside current ones
- preserve current behavior under old commands

Success criteria:

- `cdk docs ...` works as a thin alias layer
- no workflow regressions

### Phase 2: Build a unified command graph in `tooling-cli`

Deliverables:

- replace namespace-only registry with typed command tree
- support area, verb, target, aliases, help, usage, and metadata
- generate one global help surface and one catalog
- centralize shared flag normalization

Success criteria:

- `tooling-cli` owns command discovery and command help entirely
- subpackages stop defining user-facing taxonomy independently

### Phase 3: Migrate docs first

Deliverables:

- move docs orchestration from `docs-namespace.ts` into dedicated `cdk docs` handlers
- keep deterministic docs handlers sourced from `docs-pipeline`
- keep hybrid docs handlers sourced from `llm-agents`
- preserve docs-specific flags like `--quick`, `--force`, `--no-thinking`, `--model`

Success criteria:

- all docs operations are available under `cdk docs ...`
- root package does not need separate `docs:*` aliases for basic discoverability

### Phase 4: Migrate repo checks and generators

Deliverables:

- expose `arch-check` checks under `cdk repo check ...`
- expose generators under `cdk repo generate ...`
- expose `arch:check` under `cdk repo arch-check`
- keep root script aliases as compatibility wrappers only

Success criteria:

- deterministic repo maintenance is fully reachable via `cdk repo ...`

### Phase 5: Re-home review and commit workflows

Deliverables:

- move `review`, `precommit`, and `commit` under `cdk repo ...`
- keep `cdk llm ...` focused on provider/model operations and generic prompts/actions
- preserve existing reports and gating behavior

Success criteria:

- repository workflows are grouped by repo intent, not LLM implementation

### Phase 6: Remove process-spawn dispatch from primary path

Deliverables:

- replace `llm-tools` spawn-based execution with direct handler calls for normal CLI usage
- keep thin worker shims only if still needed for local compatibility
- delete duplicated help/dispatch logic where possible

Success criteria:

- normal CLI operation no longer depends on spawning `pnpm exec tsx` worker chains
- help and dispatch are single-source

### Phase 7: Deprecate and retire old aliases

Deliverables:

- deprecation warnings on `tooling`, `docs:*`, `llm:*`, `check:*`, `gen:*`, `sync:*`
- documentation migration to `cdk`
- eventual cleanup of redundant aliases after one stability window

Success criteria:

- `cdk` is the canonical documented surface
- compatibility aliases become optional rather than required

## Compatibility Strategy

### Keep during migration

- `pnpm run tooling -- ...`
- `pnpm run docs:*`
- `pnpm run llm:*`
- `pnpm run check:*`
- `pnpm run gen:*`
- `cfx-tooling`

### Add immediately

- `pnpm run cdk -- ...`
- `pnpm run cdk:docs:sync -- all`
- `pnpm run cdk:docs:enrich:api`
- `pnpm run cdk:repo:check:hotspots`
- `pnpm run cdk:repo:generate:api`
- `pnpm run cdk:llm:models`

### Deprecation rule

Old aliases should emit a warning that shows the exact `cdk` replacement.

Example:

- `llm:commit` -> `cdk repo commit`
- `docs:enrich:api` -> `cdk docs enrich api`
- `check:hotspots` -> `cdk repo check hotspots`

## Shared CLI Conventions

The unified CLI should normalize these across all areas:

- `--help`, `-h`
- `--json`
- `--quick`
- `--force`
- `--model <id>`
- `--no-thinking`
- exit codes and summary output
- report path announcements

The same flag should mean the same thing regardless of whether the command is
implemented in `arch-check`, `docs-pipeline`, or `llm-agents`.

## Non-Goals

- merging all implementation packages into one package
- rewriting `llm-client` provider/runtime logic
- changing docs content generation behavior as part of the CLI rename alone
- removing backward compatibility in the first migration phase
- renaming every internal symbol to `cdk-*`

## Risks

### 1. Command churn without ownership cleanup

If `cdk` is added as just another alias on top of current layering, fragmentation will remain.
The refactor must move taxonomy ownership into one place.

### 2. Over-merging domain packages

The right target is a unified command plane, not a giant implementation package.
Keep domain logic in domain packages.

### 3. Hidden script dependencies

Root scripts and CI may rely on legacy names. The migration needs a full compatibility map
before aliases are removed.

### 4. Docs workflows are already hybrid in uneven ways

Some docs flows already call deterministic steps internally. Others are only stitched together
at the root layer. The migration should standardize this rather than duplicating orchestration.

## Recommended First Implementation Slice

1. Add a `cdk` bin to `@cfxdevkit/tooling-cli` while keeping existing bins.
2. Replace the namespace registry with a typed command tree.
3. Implement `cdk docs ...` as the first fully unified area.
4. Add compatibility aliases that print the exact replacement command.
5. Move `repo review`, `repo precommit`, and `repo commit` next.

This gives the highest cohesion win with the lowest initial blast radius.

## Suggested Follow-up Deliverables

- command mapping table: old -> new `cdk` form
- ADR for command taxonomy and compatibility policy
- implementation checklist issue set per migration phase
- smoke-test matrix for all compatibility aliases
