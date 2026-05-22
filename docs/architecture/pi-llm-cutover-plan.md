# PI LLM Gateway Cutover Plan

## Goal

Make `cdk agent` plus the repository-local PI extension the canonical LLM runtime.
Use Lemonade for local models and PI's built-in cloud provider support for remote models.
Treat LiteLLM as a temporary compatibility layer only while direct worker flows are migrated.

## Current Gaps

- PI is the interactive shell, but most deterministic and repo workflows still call `llm-agents` directly.
- Provider resolution still lives in `llm-client`, then PI re-wraps that result in `pi-agent`.
- The checked-in local config still describes the Lemonade host as `litellm` and pins an `/api/v1` base URL.
- User-facing help still frames LiteLLM as a first-class long-term recommendation.

## Target Shape

1. `cdk` remains the public control plane.
2. `cdk agent` becomes the only LLM runtime gateway.
3. `pi-agent` owns provider registration and PI session launch.
4. `llm-agents` keeps repo-specific workflow logic only.
5. `llm-client` is reduced to compatibility helpers, then removed once direct callers are gone.

## Migration Slices

### Slice 1: Lemonade-First Config And Guidance

Status: applied

- Switch the checked-in local backend config to `provider: lemonade` with a root Lemonade base URL.
- Update low-risk docs and help text to prefer `cdk agent` surfaces and direct Lemonade semantics.
- Keep LiteLLM-compatible resolution code in place so older local overrides still work.

Validation:

- `pnpm run cdk -- agent status`
- `pnpm run cdk -- agent deterministic models`

### Slice 2: PI-Owned Provider Configuration

Status: applied

- Introduce a PI-owned provider config source under `.pi/` and make `pi-agent` the authority for provider selection.
- Adapt `llm-client` reads to consume that PI-owned config during the transition instead of owning the schema outright.
- Keep scoped unit overlays for mode and policy, but stop treating `artifacts/llm/config/llm.json` as the long-term source of truth.

Validation:

- `pnpm run cdk -- agent status`
- scoped runs such as `pnpm run cdk -- agent --scope implementation status`

### Slice 3: Route Generic LLM Work Through PI

Status: planned

- Move one-shot ask/action/review execution behind PI-backed runtime helpers instead of direct `llm-client` completion calls.
- Keep deterministic repository gates outside PI, but make PI the transport path whenever an LLM call is required.

Validation:

- `pnpm run cdk -- agent print -- --quick "..."`
- `pnpm run cdk -- repo review`

### Slice 4: Refactor `llm-agents` To Domain Logic Only

Status: planned

- Extract provider resolution and transport concerns out of `llm-agents`.
- Replace direct completion calls with PI session or PI runtime helper calls.
- Keep prompts, context building, policy selection, and workflow state in `llm-agents`.

Validation:

- focused workflow checks for commit, precommit, review, docs upkeep, and validate-models

### Slice 5: Remove Compatibility Layers

Status: planned

- Remove LiteLLM-first help and config defaults.
- Delete `llm-tools` compatibility paths once callers use `cdk agent` or `cdk repo` directly.
- Remove `LiteLLMProvider` and the old direct resolver path once no runtime flow depends on them.

Validation:

- targeted package tests
- `pnpm run cdk -- agent status`
- `pnpm run cdk -- agent deterministic models`
- `pnpm run cdk -- repo commit -- --dry-run`

## Guardrails

- Do not rewrite `resolveProvider()` or `defaultConfig()` until the direct callers above them have been reduced; GitNexus currently marks those seams as high-risk.
- Keep `cdk repo` deterministic workflows scriptable and CI-safe.
- Do not make PI the only public CLI; make it the only LLM runtime gateway.