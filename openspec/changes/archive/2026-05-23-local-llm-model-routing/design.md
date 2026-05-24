## Context

The `llm-agents` stack has two provider-level routing hooks in `providers.json`:

1. `actions: Record<string, string>` — maps an action name to a preferred model ID; resolved in `resolveExecutionContext` before the `defaultModel` fallback.
2. `actionPolicies: Record<string, LlmActionPolicy>` — extends the above with per-phase overrides (e.g. `commit.phases.failure-analysis` can target a different model than `commit` itself).

Both existed but were empty. The harness default model (`Qwen3-Coder-Next-GGUF`) was used for everything.

The precommit quality gates are filtered by feature flags: `withTests` (default `true`, `--skip-tests` to opt out) and `withBuild` (was `false`, `--with-build` to opt in). The build gate existed in `QUALITY_GATES` but was never run by default and was marked `required: false`.

Available local models on Lemonade:

| Model | Size | Labels | Role |
|-------|------|--------|------|
| `Gemma-4-26B-A4B-it-GGUF` | 16.9 GB | **hot**, tool-calling, vision, llamacpp | Always-hot tier anchor; frees Qwen3-Coder-Next from permanent residency |
| `gemma4-it-e4b-FLM` | 9.1 GB | audio, vision, reasoning, tool-calling | *Deferred — requires NPU OS changes for parallel use* |
| `Qwen3-Coder-Next-GGUF` | 43.7 GB | coding, tool-calling, hot | Default; documentation and code generation |
| `Qwen3.5-122B-A10B-GGUF-Q4_K_M` | — | custom | Highest reasoning; loads on demand |
| `Qwen3-Coder-30B-A3B-Instruct-GGUF` | 18.6 GB | coding, tool-calling, hot | Mid-tier coding; spare capacity |

Cloud: `claude-sonnet-4-5` (sonnet 4.6) — PI interactive session default; not routed through `providers.json`.

## Goals / Non-Goals

**Goals:**
- Assign each named agent action to the cheapest local model capable of completing it well.
- Keep `Gemma-4-26B-A4B-it-GGUF` as the always-hot tier anchor so `Qwen3-Coder-Next-GGUF` can be evicted when the 122B model needs headroom.
- Free `Qwen3-Coder-Next-GGUF` for doc-churn actions; it stays hot and avoids evicting other models.
- Reserve `Qwen3.5-122B-A10B-GGUF-Q4_K_M` for the reasoning-heavy actions (review, commit, release) where quality matters and the user expects a wait.
- Make build a default blocking gate in the precommit sequence, symmetric with typecheck and tests.

**Non-Goals:**
- Phase-level policy routing inside compound workflows (e.g. `commit.phases.failure-analysis`) — that requires the full `actionPolicies` wiring which is not yet consumed in `resolveExecutionContext`; deferred.
- Provider profile switching (local ↔ cloud) per action — the `providerProfiles` + profile selection path is not yet wired; deferred.
- Automatic model hot/cold state management — Lemonade controls what is hot; this design only expresses preference through model ID.

## Decisions

### Three-tier model assignment

**Tier 1 — Gemma-4-26B-A4B-it-GGUF (16.9 GB, hot, tool-calling)**
- `validation` — picks minimal commands from changed files; small context, structured output, can run while the user is idle.
- Rationale: 16.9 GB is the smallest model with the `hot` label and reliable tool-calling. Keeping this tier hot means `Qwen3-Coder-Next-GGUF` (43.7 GB) does not need to be permanently resident — it can be evicted when `Qwen3.5-122B` needs headroom.
- `gemma4-it-e4b-FLM` was the original candidate but requires NPU OS changes for parallel use and is functionally limited — deferred.

**Tier 2 — Qwen3-Coder-Next-GGUF (doc generation, hot)**
- `docs-api`, `readme-upkeep`, `package-pages`, `structure-upkeep`, `docs-upkeep`
- Rationale: All are deterministic-mode text generation over code structure. The model already loads for the default path; keeping these here avoids any model swap. Qwen3-Coder produces higher-quality API prose than gemma4 at this task.

**Tier 3 — Qwen3.5-122B-A10B-GGUF-Q4_K_M (high reasoning, on-demand)**
- `review`, `commit`, `test-audit`, `repo-health`, `changeset`, `release-readiness`, `ci-cd`, `docs-pipeline`
- Rationale: All require cross-cutting reasoning — weighing blast radius, security risk, release impact, or pipeline failure modes. The user explicitly triggers these and tolerates a model-load delay. Quality of analysis directly affects commit safety.

**defaultModel stays Qwen3-Coder-Next-GGUF** — any action not in the map (including new ones added without an explicit policy) falls back to the established default.

### Build gate flip: opt-in → opt-out

Mirroring the `--skip-tests` / `--with-tests` pattern:
- `withBuild` default flips `false → true`.
- `--skip-build` added as the escape hatch (e.g. for fast-path local iteration).
- `--with-build` retained for backwards compat (now a no-op since it's default).
- Gate `required` flips `false → true` — a failing build blocks the precheck.
- Commit post-generation re-check hard-codes `withBuild: false` deliberately (short feedback loop after generated file writes).
- Order in precommit note: `… typecheck → tests → build → hotspots …` (matches `QUALITY_GATES` array order).

### actionPolicies deferred

The `actionPolicies` key supports phase-level overrides (e.g. failure analysis uses 122B while commit message uses Coder-Next). The schema and normalisation code are already in place but `resolveExecutionContext` only reads `config.actions`, not `actionPolicies`. Wiring phase routing requires changes to the commit workflow and execution context — tracked in the existing `agent-model-policy-registry` spec, not this change.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| `Qwen3.5-122B-A10B` not loaded → long cold-start on first `review` / `commit` | Acceptable — user explicitly triggers these; Lemonade streams once warm. |
| Build gate adds ~60–90 s to every precommit | `--skip-build` opt-out available; gate runs after tests so fast failures still exit early. |
| New action added without policy → defaults to Qwen3-Coder-Next | Intentional; the default is a reasonable fallback. Review policy assignments when adding new actions. |
| `gemma4` produces lower-quality validation suggestions | Acceptable trade-off — the `validation` action produces a command list, not analysis; small context, structured output. |
