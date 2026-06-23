## Context

The `pi-agent` service currently distributes repository-related CLI commands across five separate files under `src/commands/`: `repo-actions.ts`, `repo-check.ts`, `repo-commit.ts`, `repo-run.ts`, and `repo-status.ts`. The internal `repo-check` linter flags this structure with a `kebab-groups` warning, indicating that files sharing a common `repo*` prefix should be grouped into a single kebab-case module. This fragmentation reduces module cohesion, increases import sprawl, and blocks CI validation (currently showing 1 warning, 2 errors, 6/9 passed). Consolidating these files will align with repository linting standards and improve maintainability.

## Goals / Non-Goals

**Goals:**
- Consolidate the five `repo*.ts` files into a single kebab-case module to resolve the `kebab-groups` warning.
- Improve module cohesion by grouping logically related repository commands.
- Ensure all internal imports are updated to reference the new consolidated module.
- Pass `pnpm run cdk -- repo check kebab-groups` without warnings.

**Non-Goals:**
- Refactoring the internal logic, argument parsing, or execution flow of the repository commands.
- Modifying CLI interfaces, help text, or command signatures.
- Addressing other linting errors or warnings outside the `kebab-groups` scope.
- Changes to other services, packages, or cross-cutting infrastructure.

## Decisions

- **Consolidation Strategy: Barrel Export Module**
  Create a single `repo.ts` file in `src/commands/` that re-exports the existing command classes/functions from the five original files. This approach minimizes import path changes across the codebase, preserves the original file structure during the transition, and satisfies the linter's grouping requirement immediately.
  *Alternative Considered:* Merging all implementation logic directly into `repo.ts`. Rejected due to higher risk of merge conflicts, reduced readability during the transition, and unnecessary scope creep for a linting remediation.

- **Import Path Standardization**
  All internal imports referencing `./repo-actions`, `./repo-check`, `./repo-commit`, `./repo-run`, or `./repo-status` will be updated to `./repo`. This centralizes the dependency graph and ensures consistent module resolution.
  *Alternative Considered:* Keeping individual imports but moving files into a `repo/` directory with an `index.ts`. Rejected because it introduces directory-level indirection and requires more extensive import path updates across the codebase.

- **Naming Convention**
  The consolidated module will be named `repo.ts` to align with the `repo*` prefix pattern and kebab-case requirements. This matches the linter's expectation for a single grouped module.

- **Dependency Audit**
  Before finalizing the consolidation, a shallow dependency graph audit will be performed to ensure no circular imports exist between the five files and the new `repo.ts` module.

## Risks / Trade-offs

- [Risk] Import breakage across the codebase if not all references are updated. → [Mitigation] Use IDE refactoring tools and run a global search/replace scoped to the `pi-agent` package. Validate with `pnpm run cdk -- repo check kebab-groups` and the full test suite before merging.
- [Risk] Potential circular dependencies if `repo.ts` imports from files that also import from `repo.ts`. → [Mitigation] Keep `repo.ts` as a pure re-export layer. If circular dependencies are detected, defer the consolidation of those specific files to a follow-up PR after breaking the cycle.
- [Trade-off] Barrel exports add a minor indirection layer that may slightly impact tree-shaking or bundle size. → [Trade-off] Acceptable for a linting remediation. The indirection can be flattened to direct consolidation in a future optimization pass if performance metrics indicate a need.
- [Trade-off] Temporary duplication of exports during the transition. → [Trade-off] Minimal overhead. The barrel file will be lightweight and maintained until a logical consolidation of the underlying logic is planned.

## Migration Plan

1. **Create Consolidated Module:** Add `pi-agent/src/commands/repo.ts` with barrel exports for the five existing files.
2. **Audit & Update Imports:** Run a global search within the `pi-agent` package for imports of the five original files. Update all import statements to reference `./repo`.
3. **Validate Linting:** Execute `pnpm run cdk -- repo check kebab-groups` to confirm the warning is resolved.
4. **Run Tests:** Execute the full test suite (`pnpm test`) to ensure CLI functionality, argument parsing, and command execution remain intact.
5. **Commit & PR:** Stage changes, commit with a clear message referencing the `kebab-groups` remediation, and open a PR.
6. **Rollback Strategy:** If CI fails or regressions are detected, revert the commit and restore the original import paths. The original files remain untouched until the PR is merged.

## Open Questions

- Should we merge the actual implementation logic into `repo.ts` immediately, or maintain the barrel export pattern indefinitely until a larger CLI refactoring is planned?
- Does the `repo-check` linter require a specific directory structure (e.g., `repo/` folder with `index.ts`) instead of a single file, or is a single `repo.ts` sufficient to satisfy the `kebab-groups` rule?
- Are there any external consumers (outside the `pi-agent` package) that import these command files directly, requiring cross-package import updates?
