## Context

The repository already has the root-control-plane shape this migration needs: `@cfxdevkit/tooling-cli` owns the `cdk` command taxonomy, while `llm-agents` owns repo-aware workflows and `llm-client` owns provider/config resolution. What is still missing is a real agent runtime. Today `cdk agent` is implemented in `repos/cfx-tools/infra/tooling-cli/src/agent-namespace.ts` as a mode-aware shim that routes deterministic and exploratory workflows into `llm-agents`, treats `interactive` as a fallback selector, uses `ask()` for `print`, and leaves `rpc` as documentation only.

At the same time, the repo has already invested in runtime-friendly primitives that PI can reuse:
- `llm-agents` has a central `repoActions` registry in `repos/cfx-tools/infra/llm-agents/workers/shared/index.ts`
- execution context, gate reports, and failure analysis are already structured in `llm-agents`
- `llm-client` already resolves providers, models, config files, and unit overlays
- the root CLI has already converged on namespaced command dispatch and unit-aware scope selection

The `docs/architecture/pi-coding-agent-fit.md` recommendation is to keep `cdk` as the deterministic root control plane and use PI as the runtime, TUI, session, print, and RPC engine under `cdk agent`. This design follows that recommendation and avoids turning PI into the only surface for deterministic repository operations.

## Goals / Non-Goals

**Goals:**
- Replace the current `cdk agent` interactive/print/rpc shim with a PI-backed runtime.
- Introduce a repo-local PI extension layer that owns commands, tools, prompts, provider registration, and operator UI.
- Reuse `llm-agents` as the repo workflow/business-logic layer instead of rewriting workflows directly into PI.
- Reuse `llm-client` as the source of truth for provider selection, config loading, and unit overlays.
- Expose a typed repo action contract that both the CLI compatibility layer and the PI runtime can consume.
- Preserve deterministic `cdk repo`, `cdk docs`, and similar command surfaces outside the PI runtime.

**Non-Goals:**
- Replace `cdk` with `pi` as the public root CLI for all repository tasks.
- Rewrite docs, review, commit, validation, or generation business logic out of `llm-agents` in this phase.
- Replace `llm-client` with `pi-ai` in the first migration.
- Remove all `llm-tools` compatibility surfaces immediately.
- Migrate every deterministic repo command into PI tools; only the `cdk agent` runtime path is in scope here.

## Decisions

### 1. Add a dedicated internal PI runtime package
Create a new internal package under `repos/cfx-tools/infra/` to own PI bootstrapping, extension registration, runtime entrypoints, and project-local resource loading. The working package shape is `@cfxdevkit/pi-agent` under `repos/cfx-tools/infra/pi-agent`.

Rationale:
- `tooling-cli` should remain a thin dispatcher, not a runtime host.
- `llm-tools` is currently a worker-launch layer and is the wrong long-term owner for PI bootstrapping.
- isolating PI code in its own package keeps dependency and runtime concerns separate from deterministic command routing.

Alternatives considered:
- extend `tooling-cli` directly: rejected because it would mix command dispatch with runtime hosting and UI concerns.
- extend `llm-tools`: rejected because it would preserve the legacy process-launcher package as the architectural center.

### 2. Keep `cdk` as the only public control plane and rewire `cdk agent`
`repos/cfx-tools/infra/tooling-cli/src/agent-namespace.ts` will stay the public command entrypoint, but `interactive`, `print`, and `rpc` will delegate to the PI runtime package. Existing `deterministic` and `exploratory` subcommands will remain as compatibility-oriented CLI flows, backed by the same shared repo action model used by PI.

Rationale:
- this preserves CI-friendly, scriptable command taxonomy under `cdk`
- PI becomes the runtime engine, not the top-level command taxonomy
- migration can happen without forcing maintainers to learn a second public entrypoint

Alternatives considered:
- make `pi` the public root binary: rejected because it blurs deterministic and interactive workflows.

### 3. Promote `repoActions` into a typed shared runtime contract
The current `repoActions` object in `repos/cfx-tools/infra/llm-agents/workers/shared/index.ts` will be factored into a typed registry that both CLI code and PI can consume. Each action definition should carry, at minimum:
- identifier
- title and short description
- workflow mode (`deterministic` or `exploratory`)
- prompt default and context sources
- optional CLI aliases
- optional PI UI metadata for status labels or custom renderers

`llm-agents` remains the owner of workflow execution. PI consumes definitions and calls execution helpers instead of reimplementing workflow semantics.

Rationale:
- PI needs structured command and tool registration without scraping help text
- the root CLI compatibility layer also benefits from richer action metadata
- keeping the contract in `llm-agents` avoids splitting workflow ownership across packages

Alternatives considered:
- define a second PI-only registry: rejected because it would duplicate workflow ownership.

### 4. Keep `llm-client` as the provider/config source of truth and add a PI bridge
`llm-client` will remain the owner of provider resolution, config file reading, default model selection, and unit overlays. The migration will add adapter APIs for host runtimes so PI can request:
- resolved runtime config for the repo default or a selected unit scope
- resolved provider selection under `auto`, `gateway`, and `direct` strategy rules
- discovered models and metadata suitable for PI provider/model registration

The PI runtime package will translate those APIs into PI provider and model registrations instead of defining a second configuration system.

Rationale:
- the repo already has working provider and overlay semantics
- preserving one source of truth lowers migration risk
- future consolidation with `pi-ai` can happen later if it becomes clearly beneficial

Alternatives considered:
- move all provider logic directly into PI: rejected for the first migration because it would collapse too many concerns at once.

### 5. Use project-local `.pi/` resources for repo behavior, but keep auth/session state user-scoped
The repository will add project-local PI resources under `.pi/` for settings, prompts, skills, and extension hooks that define repo behavior. User auth, persistent sessions, and other personal state remain in the normal PI user location.

Rationale:
- repo behavior becomes reproducible across environments
- maintainers can review repo-specific prompts and safety wiring in version control
- user credentials and private session history stay outside the repository

Alternatives considered:
- keep all PI configuration global: rejected because it makes repo behavior less reproducible.

### 6. Keep workflow data models in `llm-agents`; render them in PI
Execution context summaries, gate reports, failure analysis payloads, and similar workflow-state objects should remain owned by `llm-agents`. PI should consume those structures and render them in widgets, status/footer components, and custom tool output. The plain terminal renderer used by `cdk repo` remains valid.

Rationale:
- avoids logic duplication between plain CLI and PI UI
- keeps business logic and UI concerns separated
- makes it possible to keep deterministic CLI output stable while adding richer operator UI in PI

Alternatives considered:
- move HUD composition entirely into PI: rejected because `cdk repo` still needs structured non-PI output.

### 7. Keep `llm-tools` as a compatibility layer during migration
`llm-tools` will remain under `repos/cfx-tools/infra/llm-tools`, but PI-backed modes should delegate into the new PI runtime package instead of spawning the legacy worker bridge. Existing script compatibility should be preserved during the first migration slice.

Rationale:
- avoids breaking current scripts while command ownership migrates
- lets the team phase out the worker-launch path incrementally

Alternatives considered:
- remove `llm-tools` in the same change: rejected because it expands the migration blast radius unnecessarily.

## Risks / Trade-offs

- GitHub Models and custom provider parity may not map one-to-one into PI provider registration -> Mitigation: keep `llm-client` resolution authoritative and implement a custom PI adapter around the resolved provider.
- Two layers (`cdk` and PI) can confuse users if they are both treated as public entrypoints -> Mitigation: document `cdk agent` as the only supported public launch path for repo-local PI usage.
- PI UI could drift from existing terminal HUD behavior -> Mitigation: keep execution context, gate reports, and failure analysis as shared `llm-agents` data models rendered by multiple frontends.
- Project-local `.pi/` resources add another repo surface to maintain -> Mitigation: keep the initial resource set small and focused on settings, prompts, and extension registration.
- Adding PI introduces another dependency stack -> Mitigation: isolate PI dependencies in the dedicated runtime package so deterministic commands outside `cdk agent` do not take on the runtime cost.

## Migration Plan

1. Create the PI runtime package under `repos/cfx-tools/infra/pi-agent` and add PI dependencies plus bootstrapping entrypoints.
2. Refactor `llm-agents` action metadata into a typed shared registry and add structured execution payloads needed by PI tools/UI.
3. Extend `llm-client` with runtime-facing provider/config bridge APIs for repo defaults, unit overlays, and provider-strategy resolution.
4. Add project-local `.pi/` resources and repo extension registration for commands, tools, prompts, and settings.
5. Rewire `tooling-cli` `cdk agent interactive|print|rpc` into the PI runtime package and update user-facing help text.
6. Rework `llm-tools` interactive compatibility surfaces to delegate into the PI runtime instead of spawning worker scripts.
7. Implement PI operator UI rendering for execution context, gate reports, and failure analysis, then validate interactive, print, and RPC slices with focused tests.

## Open Questions

- Should `.pi/extensions/` be checked in directly, or should the runtime package generate part of the extension wiring at build time?
- Should `cdk agent deterministic` and `cdk agent exploratory` remain long-term CLI subcommands, or become compatibility aliases once PI commands are established?
- How much of the existing `llm-tools` package should survive after the first compatibility phase versus being reduced to a thin redirect layer?
- Do we want a checked-in repo-default `.pi/settings.json`, or should some settings be materialized dynamically from `artifacts/llm/config/llm.json` at runtime?