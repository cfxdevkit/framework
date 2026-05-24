# Tasks — monorepo-llm-setup

## Phase 1 — Type and config layer

- [x] **1.1** Add `LlmModelCatalogEntry` interface and `catalog` field to `LlmConfig` in `types.ts`
- [x] **1.2** Add `catalog` to `defaultConfig()` (empty array) and `normalizeConfig()` (pass-through) in `config-normalize.ts`

## Phase 2 — `providers.json` catalog + SETUP.md

- [x] **2.1** Write `.pi/SETUP.md` — hardware spec, Lemonade endpoint, model catalog per tier, token budget rationale, reconfiguration guide, cloud fallback
- [x] **2.2** Add `catalog` array to `.pi/providers.json` — one entry per known model with `id`, `tier`, `role`, `assignedActions`, `contextWindow`, `sizeGb`, `labels`

## Phase 3 — Legacy config cleanup

- [x] **3.1** Delete `artifacts/llm/config/llm.json` and `artifacts/llm/config/lemonade.json`

## Phase 4 — Consolidate arch-check imports in llm-agents

- [x] **4.1** Change `@cfxdevkit/arch-check` → `@cfxdevkit/cdk-repo-check` in `workers/docs/discover.ts`
- [x] **4.2** Change `@cfxdevkit/arch-check` → `@cfxdevkit/cdk-repo-check` in `workers/docs/readme-enrichment.ts`
- [x] **4.3** Change `@cfxdevkit/arch-check` → `@cfxdevkit/cdk-repo-check` in `workers/docs/readme.ts`
- [x] **4.4** Change `@cfxdevkit/arch-check` → `@cfxdevkit/cdk-repo-check` in `workers/docs/structure-enrichment.ts`
- [x] **4.5** Remove `@cfxdevkit/arch-check` from `llm-agents/package.json` dependencies

## Phase 5 — Documentation and spec promotion

- [x] **5.1** Add forward-reference to `.pi/SETUP.md` in `docs/adr/0004-local-llm-model-routing.md`
- [x] **5.2** Write `packages/cdk-ai/README.md` explaining its role as dynamic module boundary
- [x] **5.3** Promote `monorepo-llm-setup-doc` and `providers-catalog` to `openspec/specs/`
- [x] **5.4** Apply delta to `openspec/specs/llm-agents/spec.md`

## Phase 6 — Validate

- [x] **6.1** Typecheck passes: `pnpm exec tsc --noEmit -p infra/llm-agents/tsconfig.json`
- [x] **6.2** `cdk agent config show` shows `catalog` array in output
- [x] **6.3** `cdk agent smoke` runs without error (catalog cross-reference is informational only)
- [x] **6.4** Precommit gates pass: `cdk repo precommit --skip-tests --skip-build`
