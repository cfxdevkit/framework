# Tasks — local-llm-model-routing

Code changes (`providers.json`, `flags.ts`, `shared/index.ts`, precommit, help) were applied in the session that defined this change.

## Phase 1 — Decision Record

- [x] **1.1** Write `docs/adr/0004-local-llm-model-routing.md` (written: three-tier model routing + build gate rationale)

## Phase 2 — Spec Promotion to Global Registry

- [x] **2.1** Promote `local-model-routing` spec to `openspec/specs/local-model-routing/spec.md`
- [x] **2.2** Promote / update `precheck-build-gate` spec at `openspec/specs/precheck-build-gate/spec.md`
- [x] **2.3** Apply delta to `openspec/specs/agent-model-policy-registry/spec.md` — three-tier concrete binding

## Phase 3 — Validation

- [x] **3.1** Verify `providers.json` actions map loads correctly via `cdk repo llm config`
- [x] **3.2** Verify build gate appears in precommit sequence; confirm `--skip-build` removes it
