## Why

The monorepo has no single place that declares the hardware environment, the available LLM models, and why each model is assigned to each task tier. That intent is scattered across `providers.json` (runtime routing), `docs/adr/0004` (historical rationale), and OpenSpec specs (abstract requirements) — none of which is designed to be a living, configurable reference. At the same time, two stale config files (`artifacts/llm/config/llm.json`, `lemonade.json`) cause confusion by existing alongside the canonical `.pi/providers.json`, and `llm-agents` doc workers import directly from `@cfxdevkit/arch-check` instead of the structured `@cfxdevkit/cdk-repo-check` layer that already re-exports everything.

## What Changes

- **`.pi/SETUP.md`** — new living setup document: hardware spec (Strix Halo, 128GB), Lemonade endpoint, model catalog with context windows and task assignments, token budget rationale, and per-environment reconfiguration guide.
- **`providers.json` `catalog` section** — machine-readable model catalog embedded in the runtime config so tools (smoke test, validate-models) can verify expected models and their assignments without parsing the ADR.
- **Legacy config cleanup** — `artifacts/llm/config/llm.json` and `lemonade.json` deleted; `config.ts` legacy fallback paths retained but the files themselves removed so the canonical path is the only source.
- **`llm-agents` doc worker imports** — four files changed from `@cfxdevkit/arch-check` to `@cfxdevkit/cdk-repo-check` (which already re-exports the same symbols). `@cfxdevkit/arch-check` removed from `llm-agents` direct dependencies.

## Capabilities

### New Capabilities
- `monorepo-llm-setup-doc`: `.pi/SETUP.md` as the living declaration of hardware environment, model catalog, routing rationale, and reconfiguration guide.
- `providers-catalog`: Machine-readable `catalog` array in `providers.json` listing each model with tier, tasks, context window, and notes.

### Modified Capabilities
- `llm-agents`: Doc workers import from `@cfxdevkit/cdk-repo-check` not `@cfxdevkit/arch-check` directly; `arch-check` removed from direct dependencies.
- `local-model-routing`: ADR-0004 and `openspec/specs/local-model-routing` updated to reference `.pi/SETUP.md` as the living catalog.

## Impact

- `.pi/SETUP.md` — new file
- `.pi/providers.json` — add `catalog` array
- `artifacts/llm/config/llm.json` — deleted
- `artifacts/llm/config/lemonade.json` — deleted
- `repos/cfx-tools/infra/llm-agents/workers/docs/discover.ts` — import source change
- `repos/cfx-tools/infra/llm-agents/workers/docs/readme-enrichment.ts` — import source change
- `repos/cfx-tools/infra/llm-agents/workers/docs/readme.ts` — import source change
- `repos/cfx-tools/infra/llm-agents/workers/docs/structure-enrichment.ts` — import source change
- `repos/cfx-tools/infra/llm-agents/package.json` — remove `@cfxdevkit/arch-check` direct dependency
- `docs/adr/0004-local-llm-model-routing.md` — add forward-reference to `.pi/SETUP.md`
- `openspec/specs/local-model-routing/spec.md` — add requirement for SETUP.md as living catalog
