# July 2026 Pending Work

This document records the planned and in-progress work for the July 2026 QMS reporting period. It continues from the May 2026 legacy migration completed work and the June 2026 DevKit migration plan.

## Objective

Advance the DevKit migration to a stable release boundary, close the highest-value legacy parity gaps, and strengthen the automation surfaces (CAS worker, OpenSpec change management, docs pipeline, GitNexus/LLM intelligence) so the framework ships with verified, documented, and testable paths across all major surfaces.

---

## Planned Work

### 1. Local DEX/Swappi Stack — Decision and Port

**Status**: Not started. Blocked by scoping decision.  
**Priority**: P1

The legacy `.cfxdevkit/devkit-workspace/apps/dex-ui` and associated DEX contract artifacts have no current equivalent. `@cfxdevkit/defi-react` exists but the full Uniswap V2-compatible swap UI and token-pair seeding flow are missing.

**Tasks**:

- Decide whether the legacy local DEX belongs in `projects/examples`, `repos/cfx-tools`, or `repos/cfx-domain`.
- Port the Uniswap V2-compatible contract artifacts as a new `@cfxdevkit/dex-contracts` package under `repos/cfx-tools/packages/`.
- Port or replace the DEX UI (`apps/dex-ui`) as a project under `projects/examples/`.
- Integrate DEX state with `@cfxdevkit/devnode-server` if it remains part of the promised product surface.
- Write OpenSpec change(s) for local DEX stack behavior, deployment, seeded pools, and UI verification.

**Evidence**:

- `repos/cfx-tools/packages/dex-contracts/` (or chosen location)
- `projects/examples/apps/dex-ui/` (or chosen location)
- OpenSpec spec under `openspec/specs/`
- Integration test or smoke coverage

**Carried from**: May 2026 audit — "Local DEX Stack Port"

---

### 2. CAS Worker Integration and E2E Verification

**Status**: Partially done. Worker code exists but lacks integration test coverage.  
**Priority**: P0

The CAS backend has a `worker.ts` module with a full `Keeper` implementation using `@cfxdevkit/automation`, `GeckoTerminalPriceSource`, `SwappiPriceSource`, and `DatabaseSafetyGuard`. The worker is functional in isolation but has no E2E smoke test covering the full automation lifecycle.

**Tasks**:

- Add an E2E smoke test for the full worker lifecycle: keeper start → job discovery → price check → safety guard → execution → heartbeat.
- Verify the worker works with both `gecko_terminal` and `swappi` price sources.
- Add integration tests for the `DatabaseSafetyGuard` with dynamic settings updates.
- Ensure the `worker_heartbeat` table tracks worker PID correctly under restart.
- Update `projects/cas/README.md` to document the worker setup and configuration.

**Evidence**:

- `projects/cas/apps/backend/src/worker.test.ts` or `worker.e2e.test.ts`
- Updated `projects/cas/README.md` worker section
- CI pass with worker tests

**Carried from**: May 2026 audit — "CAS migration documentation and audit alignment"

---

### 3. Docs-Site Completion — Tasks 6-10

**Status**: In progress. Tasks 1-5 are done; Tasks 6-10 remain.  
**Priority**: P0

The `docs-site-complete-improvements` OpenSpec change has 10 tasks. Tasks 1-5 (releases, guides, api-reference, wiki post-processing, _meta navigation) are completed. Tasks 6-10 are pending.

**Tasks**:

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6 | Docker build verification (`scripts/verify-content.mjs`) | ⏳ TODO | Check required files exist, fail if critical pages missing |
| 7 | Quickstart expansion — "Next packages to try" section | ⏳ TODO | Link to executor, react, wallet-connect, devnode |
| 8 | CI coverage pre-step in `build-docs.yml` | ⏳ TODO | Run `test:coverage` before `next build` |
| 9 | Full sync validation: `sync all` + `next build` | ⏳ TODO | End-to-end verification |
| 10 | Update `docs/docs-refresh-sequence.md` | ⏳ TODO | Document new commands |

**Evidence**:

- `repos/cfx-tools/packages/docs-site/scripts/verify-content.mjs`
- Updated `build-docs.yml` CI workflow
- Updated `docs/docs-refresh-sequence.md`
- Successful `next build` after `sync all`

**Carried from**: June 2026 plan — "CAS migration and project documentation"

---

### 4. Scaffold and Template Parity

**Status**: Partial. `@cfxdevkit/create` scaffold exists with minimal-dapp, project-example, and wallet-probe templates. Legacy targets (code-server, devcontainer) are not fully mapped.  
**Priority**: P1

The legacy `.cfxdevkit/devkit-workspace/targets/` had `devcontainer` and `code-server` targets with full runtime image pipelines. The current `scaffold-cli` has templates but not a complete target pipeline.

**Tasks**:

- Compare legacy scaffold templates with `@cfxdevkit/create` and fill missing project targets.
- Remove obsolete template assumptions (deprecated tooling, old chain IDs).
- Verify generated projects install, build, and run with current workspace conventions.
- Decide whether to add a `devcontainer` target to scaffold-cli or keep it as a separate concern.
- Document supported targets in `scaffold-cli` docs.

**Evidence**:

- Updated `repos/cfx-tools/packages/scaffold-cli/src/templates/`
- Template validation commands or tests
- Updated docs describing supported targets

**Carried from**: May 2026 audit — "Runtime Image and Target Pipeline"

---

### 5. Release Readiness — Finalize Publish Pipeline

**Status**: In progress. Provenance CI was added in June; package metadata cleanup continues.  
**Priority**: P0

June commits added OIDC-based provenance, PAT auth for first-time creates, and `repository.url` to all packages. The publish pipeline is closer to production-ready but needs final validation.

**Tasks**:

- Finalize native dependency policy: recheck `better-sqlite3` build scripts after Node 24 upgrade for duplicate or conflicting pnpm build-script settings.
- Validate all 27+ framework packages have correct `exports`, `typesVersions`, and public API boundaries.
- Run `moon publish --dry-run` across the full workspace to verify metadata and dependency resolution.
- Ensure CI `release` workflow passes end-to-end for a real package (e.g., `@cfxdevkit/cdk`).
- Document the release process in `docs/guides/publishing-a-framework-package.md`.

**Evidence**:

- CI run references for `moon publish`
- Package metadata diffs
- Release notes or Changesets
- Published package on npm with provenance

**Carried from**: June 2026 plan — "Release readiness and native dependency policy"

---

### 6. GitNexus and LLM Intelligence Refresh

**Status**: Ongoing. Recent structural changes (changeset integration, config extraction, docs pipeline) may have stale index data.  
**Priority**: P1

The June commit history shows significant structural changes. GitNexus index and LLM corpus need refreshing to reflect the new package boundaries, execution flows, and architecture rules.

**Tasks**:

- Run `npx gitnexus analyze` to refresh symbols, relationships, and execution flows.
- Update `artifacts/llm/` corpus with new package surfaces (`@cfxdevkit/llm-agents` refactoring, `changeset-generate.ts`, `config-helpers.ts`).
- Update agent-facing instructions so local models use indexed code intelligence rather than broad file scans.
- Document how GitNexus, OpenSpec artifacts, and architecture rules reduce token usage for cloud models.
- Validate `detect_changes()` works correctly after the `commands.ts` refactoring (384 → 178 lines).

**Evidence**:

- Updated `artifacts/llm/` corpus or reports
- Updated `docs/llm-automation-agents.md`
- GitNexus analysis or detected-change summaries
- `repo_check` passes after refactoring

**Carried from**: June 2026 plan — "GitNexus and LLM repository intelligence expansion"

---

### 7. OpenHands / Browser IDE Decision

**Status**: Undecided. Legacy OpenHands and target/code-server workflows need a go/no-go assessment.  
**Priority**: P2

The legacy `.cfxdevkit/devkit-workspace/targets/code-server` and OpenHands configuration need to be compared against the current devcontainer, GitNexus, and LLM automation model.

**Tasks**:

- Compare legacy OpenHands and code-server workflows against the current devcontainer + GitNexus + LLM automation model.
- Decide whether to port, replace, or retire the old workflows.
- If retiring, document the migration path and alternatives for contributors who used OpenHands/code-server.
- If porting, scope the effort and create an OpenSpec change.

**Evidence**:

- Decision note or ADR-style documentation (`docs/adr/0006-mcp-tool-allowlist.md` or new)
- Updated migration audit if work is deferred or retired

**Carried from**: May 2026 audit — "target/code-server parity"

---

### 8. Keystore Backend Expansion

**Status**: Partial. File and in-memory backends exist. Docker sidecar pattern documented. Server-standalone spec exists.  
**Priority**: P2

The keystore supports file and in-memory backends. A Docker sidecar pattern is documented in `docs/keystore-docker.md`. The `keystore-server-standalone` spec exists in OpenSpec.

**Tasks**:

- Implement the keystore server standalone from the existing OpenSpec spec (`keystore-server-standalone`).
- Add Unix socket bridge for host-to-container keystore communication.
- Evaluate hardware keystore integration (HSM, YubiKey) against Ledger/OneKey/Satochip already supported.
- Document the keystore backend decision matrix in `docs/architecture/`.

**Evidence**:

- `repos/cfx-tools/packages/keystore-server/` (or equivalent)
- Unix socket bridge implementation
- Updated `docs/keystore-docker.md` or new architecture doc
- OpenSpec change for keystore server standalone

**Carried from**: May 2026 audit — "Finalize planned keystore backends beyond file and in-memory support"

---

### 9. CAS OpenSpec Spec Implementation

**Status**: 21 CAS specs exist but need implementation tracking.  
**Priority**: P1

The CAS project has 21 OpenSpec specs in `openspec/specs/cas-*`. These define requirements for the CAS frontend, backend, and wizard. Some have been implemented; others need work.

**Spec inventory**:

| Spec | Status | Notes |
|------|--------|-------|
| cas-api-proxy | ✅ Implemented | Next.js catch-all route exists |
| cas-approval-widget | ⏳ Partial | Widget code exists, may need modal overlay polish |
| cas-e2e-smoke | ⏳ Pending | Requires E2E test (see Item 2 above) |
| cas-env-config | ✅ Implemented | `.env.example` exists |
| cas-home-dashboard | ⏳ Needs review | Purpose marked "TBD" |
| cas-job-delete | ✅ Implemented | DELETE /jobs/:id exists |
| cas-local-run-guide | ✅ Implemented | README has API surface |
| cas-nav-wallet-widget | ✅ Implemented | NavBar exists |
| cas-safety-config | ✅ Implemented | GET /admin/safety exists |
| cas-siwe-error-messages | ✅ Implemented | Auth context error handling exists |
| cas-token-display | ✅ Implemented | JobsTable shows symbols |
| cas-wcfx-wrap-modal | ✅ Implemented | Wrap/unwrap modal exists |
| cas-wizard-contract-mode | ✅ Implemented | Wizard step exists |
| cas-wizard-env-check | ✅ Implemented | Node.js version check exists |
| cas-wizard-env-write | ✅ Implemented | .env writing exists |
| cas-wizard-keeper-config | ✅ Implemented | Keeper toggle exists |
| cas-wizard-launch | ✅ Implemented | Build + launch exists |
| cas-wizard-network-select | ✅ Implemented | Network picker exists |

**Tasks**:

- Implement `cas-e2e-smoke` test (tied to Item 2 above).
- Clarify and implement `cas-home-dashboard` (purpose TBD).
- Polish `cas-approval-widget` modal overlay if needed.
- Archive implemented specs and create follow-up changes for any gaps.

**Evidence**:

- E2E smoke test pass
- Updated `cas-home-dashboard` spec with clear requirements
- Archived implemented specs in `openspec/archive/`

**Carried from**: June 2026 plan — "CAS migration and project documentation"

---

### 10. Documentation Gap Closure

**Status**: Target structure defined in `docs/STRUCTURE.md` but many sections are empty.  
**Priority**: P2

The `docs/STRUCTURE.md` target layout defines 7 top-level sections. The current implementation has only a subset.

**Gap inventory**:

| Section | Target | Current | Status |
|---------|--------|---------|--------|
| `docs/architecture/` | 6 files + diagrams | ~5 files, no diagrams | ⏳ 1 file + diagrams needed |
| `docs/adr/` | 7 ADRs | 5 ADRs | ⏳ ADR-0006 (mcp-tool-allowlist) needed |
| `docs/guides/` | 10 guides | 1 guide (changeset.md) | ⏳ 9 guides needed |
| `docs/api/` | Generated API ref | Not generated | ⏳ TypeDoc pipeline needed |
| `docs/projects/` | 4 project docs | 0 docs | ⏳ CAS, chainbrawler, conflux-phaser, electro |
| `docs/security/` | 6 files | 0 files | ⏳ All security docs needed |
| `docs/reference/` | 3 files | 0 files | ⏳ glossary, chains, deployments |

**Tasks**:

- Create `docs/architecture/overview.md` (5-tier overview + dependency graph diagram).
- Create `docs/architecture/diagrams/tiers.mmd` and `keystore-backends.mmd`.
- Write ADR-0006: MCP tool allowlist.
- Create 4 critical guides: `getting-started.md`, `moon-quickstart.md`, `using-the-devcontainer.md`, `publishing-a-framework-package.md`.
- Set up TypeDoc pipeline for `docs/api/` generation.
- Write `docs/projects/cas.md` (other projects can follow the pattern).
- Create `docs/security/threat-model.md` (STRIDE analysis).
- Create `docs/reference/chains.md` and `docs/reference/glossary.md`.

**Evidence**:

- Files created in each target section
- Diagrams render in Mermaid/Draw.io viewers
- TypeDoc output in `docs/api/`

**Carried from**: June 2026 plan — "CAS migration and project documentation" + `docs/STRUCTURE.md`

---

### 11. CI Quality Gates

**Status**: CI is green but could benefit from additional gates.  
**Priority**: P1

The current CI includes build, lint, typecheck, and test tasks. Additional quality gates would improve confidence before release.

**Tasks**:

- Add architecture rules validation (`@cfxdevkit/arch-rules`) as a CI step.
- Add OpenSpec spec validation (`openspec validate`) as a CI step.
- Add `detect_changes()` verification for PRs to catch scope drift.
- Add a "docs verify" step that runs `pnpm --filter @cfxdevkit/docs-pipeline run docs -- validate`.
- Consider adding a "changeset check" to ensure `.changeset/` files exist for user-facing changes.

**Evidence**:

- Updated CI workflow files in `.github/workflows/`
- CI passes with all new gates
- PRs blocked by quality gates as expected

**Carried from**: June 2026 plan — "Keep CI green across build, lint, typecheck, and test tasks"

---

## Acceptance Criteria

- All planned work is represented in the current repository structure, not only in legacy folders.
- CI remains successful after all migration work.
- Each completed area has a verifiable code path, documentation path, test path, or commit reference.
- GitNexus and LLM artifacts are refreshed or updated where repository structure changes.
- Remaining gaps are explicitly documented rather than hidden.
- OpenSpec changes are archived when implementation is complete.

---

## Planned Timeline

- Proposed date: 2026-07-01
- Start date: 2026-07-01
- Finish date: 2026-07-31
- Reporting period: July 2026

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Local DEX port requires significant contract work | P1 | Defer to projects/examples; use Swappi as the production path |
| CAS worker E2E tests need testnet/mainnet RPC access | P1 | Use devnode mode for all tests; mock RPC where needed |
| Docs gap closure depends on writer bandwidth | P2 | Use LLM-assisted generation for first drafts; human review second |
| Keystore server standalone may conflict with Docker sidecar pattern | P2 | Implement as a single binary with both modes; document tradeoffs |
| Release pipeline provenance may fail for new packages | P1 | Skip provenance for new packages; add clear error message |
