## Context

The codebase currently contains four hard hotspot files that exceed recommended complexity thresholds, as identified by the `repo check hotspots` command. These files—`repo-namespace.ts`, `agent-namespace.ts`, `repo-namespace.test.ts`, and `check.ts`—exhibit high line counts (430–991 lines) and elevated complexity scores (991–1444), violating OpenSpec’s modularity constraints and increasing maintenance burden.

These hotspots are concentrated in two areas:
- **CLI tooling** (`tooling-cli/src/`): core namespace and test logic
- **LLM agent workers** (`llm-agents/workers/agents/`): single-file agent orchestration

The current state violates the OpenSpec validation context (status: error), blocking CI/CD gates and increasing risk of regressions during feature development. Stakeholders include platform engineers, infra tooling maintainers, and LLM agent developers—each relying on stable, modular primitives.

## Goals / Non-Goals

**Goals:**
- Decompose the four hard hotspot files into smaller, cohesive modules (≤300 lines, ≤800 complexity score per module).
- Preserve all existing functionality and test coverage.
- Introduce clear module boundaries aligned with domain responsibilities (e.g., `repo-namespace.ts` → `repo-namespace/namespace.ts`, `repo-namespace/registry.ts`, `repo-namespace/validation.ts`).
- Enforce modularity constraints via updated OpenSpec rules and CI checks.
- Improve testability and reduce cognitive load for future contributors.

**Non-Goals:**
- Refactoring soft hotspots (e.g., `page.tsx`, `forms.css`) in this change—these are tracked separately.
- Changing runtime behavior, APIs, or external interfaces beyond what is necessary for decomposition.
- Introducing new dependencies or frameworks (e.g., no new DI containers or macro-based codegen).
- Modifying test logic beyond reorganizing it to match new module structure.

## Decisions

### 1. Module Decomposition Strategy: Domain-Driven Submodules

**Decision:** Split each hotspot into 2–4 domain-aligned submodules (e.g., `namespace.ts`, `registry.ts`, `validation.ts`, `types.ts`) rather than arbitrary file splitting.

**Rationale:** Domain-driven boundaries ensure modules reflect real-world responsibilities (e.g., registry vs. validation), reducing coupling and improving discoverability. Arbitrary splitting (e.g., by line count alone) would fragment cohesive logic and increase refactoring risk.

**Alternatives considered:**
- *File-by-file with generic names* (e.g., `part1.ts`, `part2.ts`) → rejected due to poor semantics and future maintainability.
- *Single “facade + helpers” pattern* → rejected as it would still centralize complexity in the facade.

### 2. Test Refactoring: Mirror Module Structure in Tests

**Decision:** Refactor `repo-namespace.test.ts` to mirror the new `repo-namespace/` module structure, with one test file per submodule (e.g., `registry.test.ts`, `validation.test.ts`).

**Rationale:** Test isolation improves feedback loops and reduces flakiness. Parallel test structure also simplifies coverage reporting and makes test maintenance scalable.

**Alternatives considered:**
- *Keep monolithic test file* → rejected due to continued hotspots and slower CI runs.
- *Integration tests only* → rejected as unit-level granularity is critical for CLI tooling correctness.

### 3. Agent Worker Refactoring: Extract Orchestration from Implementation

**Decision:** Split `check.ts` (991 lines) into:
- `orchestrator.ts`: high-level control flow (no business logic)
- `steps/`: domain-specific step handlers (e.g., `lint.ts`, `typecheck.ts`, `test.ts`)
- `types.ts`: shared interfaces

**Rationale:** The current `check.ts` conflates orchestration with implementation, making it hard to extend or test. Separating concerns enables step reuse and simplifies mocking in tests.

**Alternatives considered:**
- *State machine pattern* → rejected due to over-engineering for current use cases.
- *Plugin architecture* → deferred to future iteration; not required for this remediation.

### 4. Enforce Modularity via OpenSpec Rules

**Decision:** Update OpenSpec’s `modularity` constraint to include:
- Max lines per file: 300
- Max complexity score: 800
- Hard error on violations (no warnings)

**Rationale:** Prevents recurrence of hotspots. Current soft limits (warnings) were insufficient; hard enforcement aligns with OpenSpec’s “fail-fast” philosophy.

**Alternatives considered:**
- *Per-module thresholds only* → rejected as file-level limits catch regressions earlier.
- *Score-based only* → rejected due to tooling variability; line count is more predictable.

## Risks / Trade-offs

- **[Risk]** Breaking changes to internal APIs (e.g., renamed exports) may break downstream consumers (e.g., internal scripts, CI workflows).  
  → **Mitigation:** Preserve public exports in facade modules (e.g., `repo-namespace/index.ts` re-exports all submodules); add deprecation warnings for internal-only paths.

- **[Risk]** Test refactoring may temporarily reduce coverage if migration is incomplete.  
  → **Mitigation:** Run coverage reports after each submodule migration; block PRs if coverage drops >2% per module.

- **[Risk]** Over-decomposition (too many tiny files) may increase navigation overhead.  
  → **Mitigation:** Enforce max 4 submodules per hotspot; use `index.ts` barrel files for clean imports.

- **[Risk]** Agent worker refactoring may introduce latency if orchestration logic becomes less efficient.  
  → **Mitigation:** Benchmark `check` execution time pre/post-refactor; optimize hot paths in orchestrator.

## Migration Plan

1. **Phase 1: Module scaffolding**  
   - Create new submodule directories (e.g., `repo-namespace/`, `check/steps/`)  
   - Add `index.ts` barrel files with exports (initially re-exporting original logic)  
   - Update imports across the codebase to use new paths (e.g., `from './repo-namespace'` → `from './repo-namespace/index'`)

2. **Phase 2: Incremental extraction**  
   - Extract one submodule at a time (e.g., `registry.ts` from `repo-namespace.ts`)  
   - Add tests for each submodule  
   - Run `repo check hotspots` after each extraction to validate thresholds

3. **Phase 3: Cleanup**  
   - Delete original hotspot files once all logic is migrated  
   - Update OpenSpec rules and CI checks  
   - Document new module structure in `docs/architecture/tooling-cli.md`

4. **Rollback Strategy**  
   - Use feature branches with automated hotspots checks  
   - If validation fails, revert the branch and rebase on smaller commits  
   - No database/schema migrations required; purely file-level changes

## Open Questions

- **Q1:** Should `agent-namespace.ts` and `repo-namespace.ts` share a common `namespace` module (e.g., `shared/namespace.ts`) given overlapping patterns?  
  → *Decision needed:* Evaluate duplication vs. over-abstraction trade-off before Phase 1.

- **Q2:** How to handle circular dependencies introduced by submodule exports (e.g., `validation.ts` → `registry.ts` → `validation.ts`)?  
  → *Decision needed:* Prefer restructuring logic (e.g., move shared types to `types.ts`) or introduce a facade layer.

- **Q3:** Should the `check.ts` orchestrator support async step registration (e.g., via `registerStep()`)?  
  → *Deferred:* Out of scope for this remediation; focus on decomposition first.
