# ADR-0004 — Local LLM Model Routing and Build Gate Promotion

- **Status:** Accepted
- **Date:** 2026-05-23
- **Supersedes:** none
- **Related:** ADR-0001 (build stack), ADR-0003 (multi-repo split), `agent-model-policy-registry` spec, `agent-commit-runtime` spec
- **Living reference:** `~/.pi/agent/providers.json` — model catalog, token budgets, and reconfiguration guide

---

## Context

The `llm-agents` stack exposes two provider-level routing hooks in `~/.pi/agent/providers.json`:

```jsonc
{
  "actions": {},          // action-name → model-ID (simple routing)
  "actionPolicies": {}    // action-name → { model, phases: { phase → model } } (phase routing)
}
```

Both existed but were empty. Every agent action — from trivial command suggestion to full release-readiness review — ran against the same `defaultModel` (`Qwen3-Coder-Next-GGUF`, 43.7 GB). The cloud LLM (sonnet 4.6) was reached for tasks a small local model could own.

Seven local models are available on the Lemonade stack:

| Model | Size | Labels |
|-------|------|--------|
| `Gemma-4-26B-A4B-it-GGUF` | 16.9 GB | **hot**, tool-calling, vision, llamacpp |
| `Qwen3-Coder-Next-GGUF` | 43.7 GB | coding, tool-calling, **hot** |
| `Qwen3-Coder-30B-A3B-Instruct-GGUF` | 18.6 GB | coding, tool-calling, hot |
| `gemma4-it-e4b-FLM` | 9.1 GB | audio, vision, reasoning, tool-calling, chat-transcription — *requires NPU OS changes for parallel use; deferred* |
| `Qwen3.5-122B-A10B-GGUF-Q4_K_M` | — | custom |
| `MiniMax-M2.5-GGUF-UD-IQ3_XXS` | — | custom |
| `Qwen2.5-Coder-1.5B-Instruct-GGUF` | — | custom |

**Cloud:** `claude-sonnet-4-5` (PI interactive session default) — not routed through `providers.json`; this ADR does not change PI session behaviour.

A second related issue: the `build` quality gate existed in `QUALITY_GATES` but was opt-in (`--with-build`, default `false`) and `required: false`. It was never run in the normal precommit flow.

---

## Decision

### 1 — Three-tier model assignment via the `actions` map

Each named agent action is assigned to the smallest model tier capable of completing it well.

#### Tier 1 — `Gemma-4-26B-A4B-it-GGUF` (16.9 GB, hot, tool-calling)

| Action | Why this tier |
|--------|--------------|
| `validation` | Picks minimal commands from changed files. Small context, structured list output, no deep reasoning. Runs while the user is idle or the heavier models are occupied. |

`Gemma-4-26B-A4B-it-GGUF` is the always-hot tier anchor. At 16.9 GB it is the smallest model with the `hot` label and reliable tool-calling — meaning Lemonade keeps it loaded. By routing lightweight tasks here, `Qwen3-Coder-Next-GGUF` (43.7 GB) does not need to stay resident permanently: it can be evicted when `Qwen3.5-122B-A10B-GGUF-Q4_K_M` needs to load, giving the reasoning tier a larger effective VRAM budget.

**Why not `gemma4-it-e4b-FLM`:** That model (9.1 GB) is functionally limited and requires OS-level changes to run on the NPU in parallel with other models. Its use is deferred until those OS changes are available.

#### Tier 2 — `Qwen3-Coder-Next-GGUF` (43.7 GB, hot, current `defaultModel`)

| Action | Why this tier |
|--------|--------------|
| `docs-api` | API.md skeleton enrichment from code structure. |
| `readme-upkeep` | README placeholder fill from package context. |
| `package-pages` | MDX docs-site page enrichment. |
| `structure-upkeep` | STRUCTURE.md generation from directory layout. |
| `docs-upkeep` | Doc maintenance recommendations from alignment report. |

All five are deterministic-mode text generation over structured code context. The model stays hot for the default code-generation path; routing these here avoids any model swap. Qwen3-Coder produces higher-quality API prose than gemma4 for this task class.

#### Tier 3 — `Qwen3.5-122B-A10B-GGUF-Q4_K_M` (on-demand, highest reasoning)

| Action | Why this tier |
|--------|--------------|
| `review` | Cross-cutting code review: bugs, security, regression risk. |
| `commit` | Commit message generation + risk assessment over changed scope. |
| `test-audit` | Test and precheck coverage gap analysis. |
| `repo-health` | Repo drift, automation gaps, next-validation guidance. |
| `changeset` | Changeset readiness and bump-level correctness. |
| `release-readiness` | Release blockers: publish flow, OIDC, version alignment. |
| `ci-cd` | CI/CD pipeline failure modes and missing secrets. |
| `docs-pipeline` | Docs build, wiki sync, image, and deploy flow risk. |

All eight require reasoning across multiple concerns simultaneously — blast radius, security posture, release impact, pipeline failure modes. The user explicitly triggers these and tolerates a model-load delay. Quality of analysis directly affects commit and release safety.

#### `defaultModel` fallback

Any action not in the `actions` map falls back to `Qwen3-Coder-Next-GGUF`. New actions added without an explicit policy get a reasonable default.

#### Per-call `--model` override precedence

`resolveExecutionContext` resolution order (highest to lowest priority):

```
--model flag  >  actions[action]  >  defaultModel  >  provider default
```

---

### 2 — Build gate: opt-in → opt-out (blocking)

| Property | Before | After |
|----------|--------|-------|
| `withBuild` default | `false` | `true` |
| Flag to disable | `--with-build` (enable) | `--skip-build` (disable) |
| `--with-build` | enables build | retained, now a no-op |
| Gate `required` | `false` | `true` |
| Gate position in sequence | after tests | after tests |

The `--skip-build` / `--with-build` pair mirrors the existing `--skip-tests` / `--with-tests` pattern exactly.

**Post-generation commit check exception:** `commit.ts` hard-codes `withBuild: false` for the post-generation re-check (lint/typecheck/tests after generated file writes). This is intentional — build is expensive and a short feedback loop is more valuable there.

**Documented gate sequence:**
```
gitnexus analyze → format → lint → typecheck → tests → build → hotspots → kebab-groups → repo check
```

---

## Consequences

### Positive

- `Gemma-4-26B-A4B-it-GGUF` handles background tasks (validation guidance) without evicting larger models — it is the smallest always-hot model with tool-calling.
- Documentation churn (`docs-api`, `readme-upkeep`, `package-pages`, `structure-upkeep`, `docs-upkeep`) never evicts models from VRAM; `Qwen3-Coder-Next` is already hot.
- High-value reasoning tasks (`review`, `commit`, `changeset`, `release-readiness`) use the best available local model, reducing the cases where cloud LLM is needed for routine work.
- Build failures are caught before commit rather than discovered in CI.
- The `actions` map is now a living, version-controlled routing table — adding a new action and assigning its tier is a one-line config change.

### Negative

- `Qwen3.5-122B-A10B-GGUF-Q4_K_M` cold-start latency (first `review` or `commit` of a session) is visible. Acceptable — the user explicitly triggers these.
- Build gate adds ~60–90 s to every precommit. `--skip-build` is available for fast-path iteration.
- Routing misconfiguration (wrong model name in `actions`) silently falls back to `defaultModel` rather than erroring — discoverable via `cdk repo llm config`.

---

## Non-goals

- **Phase-level routing** (`actionPolicies.commit.phases.failure-analysis`) — the `actionPolicies` key is normalised but not yet consumed in `resolveExecutionContext`. Wiring this requires changes to the commit workflow. Tracked in `agent-model-policy-registry` spec.
- **Provider profile switching** (local ↔ cloud per action) — `providerProfiles` schema exists; selection path not yet wired. Deferred.
- **Automatic model preheating** — Lemonade controls what is hot; this ADR expresses preference through model ID only.
- **Qwen3-Coder-30B-A3B assignment** — available and hot but not yet needed; held as a spare mid-tier option if `Qwen3-Coder-Next` VRAM pressure increases.

---

## Follow-up

1. Wire `actionPolicies` phase overrides into `resolveExecutionContext` so `commit.phases.failure-analysis` can target `Qwen3.5-122B` while `commit.phases.message-generation` uses `Qwen3-Coder-Next`. Tracked: `agent-model-policy-registry` spec + `agent-commit-runtime` spec.
2. Add `Qwen3-Coder-30B-A3B` as a named tier-2.5 option once VRAM pressure analysis shows `Qwen3-Coder-Next` being evicted during parallel doc runs.
3. Re-evaluate `gemma4-it-e4b-FLM` as a tier-0 option once the NPU OS changes enabling parallel model use are available — could take `validation` and similar idle tasks with near-zero VRAM cost.
