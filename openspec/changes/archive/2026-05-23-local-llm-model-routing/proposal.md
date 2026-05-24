## Why

All LLM agent actions ran against the same default model (`Qwen3-Coder-Next-GGUF`), regardless of whether the task needed lightweight structured output, documentation churn, or deep reasoning — wasting VRAM bandwidth and forcing the cloud LLM (sonnet 4.6) to handle tasks that small local models can own. The `actions` and `actionPolicies` hooks in `providers.json` already exist but were empty.

## What Changes

- **Populate `actions` map** in `.pi/providers.json` with a three-tier model routing policy: gemma4 for lightweight tasks, Qwen3-Coder-Next for doc generation, Qwen3.5-122B for high-reasoning tasks.
- **Build gate is now a default precheck step** — `withBuild` flips to `true`, `--skip-build` added as the opt-out flag, `required: true` on the gate, and order notes updated in precommit and skill docs.
- **ADR-0004 written** capturing the model routing rationale, tier assignments, and equilibrium design.
- **Spec `local-model-routing` added** formalising the routing requirements so future model additions follow the same policy contract.
- **Spec `precheck-build-gate` added** formalising the build gate as a required quality step.

## Capabilities

### New Capabilities
- `local-model-routing`: Three-tier action-to-model policy for the local Lemonade stack — defines which actions belong to each tier and how the routing is configured in `providers.json`.
- `precheck-build-gate`: Build is a first-class precheck gate — default-on, opt-out via `--skip-build`, required (blocking).

### Modified Capabilities
- `agent-model-policy-registry`: First concrete implementation of the action policy registry — the `actions` map is now populated; this satisfies the "documentation upkeep prefers a local profile" and "no action policy falls back to default" scenarios.

## Impact

- `.pi/providers.json` — actions map populated (already applied).
- `repos/cfx-tools/infra/llm-agents/workers/commit/flags.ts` — `withBuild` default + `--skip-build` (already applied).
- `repos/cfx-tools/infra/llm-agents/workers/shared/index.ts` — build gate `required: true` (already applied).
- `repos/cfx-tools/infra/llm-agents/workers/commit/precommit.ts` — order note updated (already applied).
- `repos/cfx-tools/infra/llm-agents/workers/help.ts` — help text updated (already applied).
- `.pi/prompts/repo-system.md` and `.pi/skills/repo-actions.md` — validation order updated (already applied).
- `docs/adr/0004-local-llm-model-routing.md` — new ADR (to write).
