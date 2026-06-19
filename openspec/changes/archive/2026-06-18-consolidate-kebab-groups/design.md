## Context

The monorepo currently triggers a `kebab-groups` structural warning due to 113 files scattered across 38 kebab-case groups. This file sprawl reduces module cohesion, increases cognitive load, and complicates maintenance across `tooling-cli`, `arch-check`, `llm-agents`, `pi-agent`, and `react-ui`. The validation context indicates 1 warning remains, specifically targeting five identified kebab groups that can be consolidated into single kebab-case modules. This change addresses the warning by restructuring these groups while preserving existing import contracts and test coverage.

## Goals / Non-Goals

**Goals:**
- Consolidate the 5 identified kebab groups into single, cohesive kebab-case modules
- Resolve the `kebab-groups` structural warning and improve module cohesion
- Maintain backward-compatible import paths for internal consumers via barrel exports
- Co-locate and consolidate test files to preserve coverage mapping
- Establish a repeatable consolidation pattern for future structural remediation

**Non-Goals:**
- Refactoring business logic, runtime behavior, or public APIs
- Addressing the 2 existing validation errors unrelated to kebab groups
- Modifying packages outside the 5 specified tooling/agent/UI scopes
- Implementing new tooling or CI rules beyond the immediate consolidation

## Decisions

**1. Consolidation Strategy: Single Module per Group**
- **Decision:** Merge all files within each kebab group into a single kebab-case module (e.g., `agent*.ts` → `agent-config.ts`, `check*.ts` → `check-ci.ts`, etc.).
- **Rationale:** Eliminates file sprawl, aligns with the kebab-case naming convention, and reduces import complexity.
- **Alternatives Considered:** 
  - Directory-based grouping: Rejected because it does not resolve the `kebab-groups` warning and adds path depth.
  - Individual file renaming: Rejected because it increases merge conflict risk and does not improve cohesion.

**2. Export Pattern: Barrel Re-exports**
- **Decision:** Use barrel exports (`export * from './internal-file'`) in the consolidated module to mirror the original public API surface.
- **Rationale:** Preserves existing import paths for internal consumers, avoiding widespread search-and-replace operations and reducing migration risk.
- **Alternatives Considered:**
  - Direct import updates: Rejected due to high refactoring overhead and risk of breaking internal consumers.
  - Explicit named exports only: Rejected because it requires updating all consumer files and increases maintenance burden.

**3. Test Co-location & Consolidation**
- **Decision:** Consolidate test files into a single `*.test.ts` file per group, co-located with the source module.
- **Rationale:** Maintains clear test-to-source mapping, simplifies coverage reporting, and aligns with modern monorepo testing practices.
- **Alternatives Considered:**
  - Keeping separate test files: Rejected because it perpetuates the sprawl the warning targets.
  - Moving tests to a top-level `__tests__` directory: Rejected because it breaks local test discovery and increases path complexity.

**4. Automation-Assisted Refactoring**
- **Decision:** Use a hybrid approach: automated scripts for initial file merging, export generation, and import path mapping, followed by manual review for logical grouping and comment structuring.
- **Rationale:** Balances speed with accuracy, ensuring logical boundaries are preserved while minimizing manual effort.
- **Alternatives Considered:**
  - Fully manual refactoring: Rejected due to high error risk across 113 files.
  - Fully automated refactoring: Rejected because it cannot reliably preserve logical section boundaries or handle edge-case imports.

## Risks / Trade-offs

[Risk] Consolidated files may grow large, reducing navigability and increasing merge conflict frequency. → [Mitigation] Enforce logical section headers, limit consolidated files to ~300-400 lines, and split modules if complexity or team feedback warrants it.

[Risk] Barrel exports may cause circular dependency issues or hinder tree-shaking in production builds. → [Mitigation] Audit imports for cycles, prefer explicit named exports where feasible, and verify build output and bundle size impact.

[Risk] Import path breakage during migration may cause runtime or type-check failures. → [Mitigation] Maintain backward-compatible re-exports initially, run full test suites and type checks, and use IDE refactoring tools for safe updates.

[Risk] Test consolidation may obscure which tests cover which original files. → [Mitigation] Preserve original file names in test suite descriptions, maintain clear section comments, and run coverage reports to verify mapping.

## Migration Plan

1. **Audit & Map:** Scan all imports across the 5 packages to identify consumers of the 38 groups. Document external/internal dependencies.
2. **Create Consolidated Modules:** Generate the target kebab-case files with barrel exports mirroring the original public API. Co-locate and merge test files.
3. **Update Imports:** Replace direct file imports with consolidated module imports. Update test imports and coverage configurations.
4. **Validate:** Run `pnpm run cdk -- repo check kebab-groups` to confirm warning resolution. Execute full test suites, type checks, and linting.
5. **Deploy & Monitor:** Merge the change, monitor CI/CD for import/runtime errors, and collect feedback from package maintainers.
6. **Rollback:** If critical breakage occurs, revert the PR, restore original file structure, and re-evaluate the export strategy.

## Open Questions

- Should we implement a CI rule to prevent future kebab-group sprawl and enforce the consolidation pattern?
- Are there any external tooling, scripts, or third-party consumers outside the monorepo that directly import these internal paths?
- How should we handle the transition period for the 2 existing validation errors unrelated to this change, and should they be addressed in a follow-up PR?
- What is the team's preferred maximum file size threshold for consolidated modules before splitting is required?
