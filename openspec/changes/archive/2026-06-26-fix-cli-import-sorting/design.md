## Context

The `devnode-server` service currently fails CI checks (`devnode-server:lint` and `wallet:build`) due to ESLint `import/order` rule violations in the CLI command module. The imports for CLI flags (`statusFromFlags`, `chainFromFlags`, `addressFromFlags`, `keystoreFromFlags`, etc.) are currently placed out of alphabetical order, causing the linter to flag them as errors. This breaks the build pipeline, resulting in a 4/9 pass rate with 4 errors. The project uses a monorepo structure managed by pnpm, and linting is enforced via ESLint with the `import` plugin. The issue is isolated to import ordering and does not indicate broken functionality or architectural flaws.

## Goals / Non-Goals

**Goals:**
- Reorder CLI command imports to satisfy ESLint `import/order` alphabetical sorting rules.
- Resolve `devnode-server:lint` and `wallet:build` CI errors to restore pipeline health.
- Establish a deterministic, maintainable import structure that prevents recurrence.

**Non-Goals:**
- Refactoring CLI command architecture or logic.
- Modifying ESLint configuration rules or adding new dependencies.
- Addressing unrelated lint warnings or errors in other modules.
- Implementing global auto-fixes that could affect unrelated files.

## Decisions

**1. Alphabetical Sorting of Relative Imports**
- *Decision:* Reorder the `./commands/*.js` imports strictly alphabetically.
- *Rationale:* ESLint's `import/order` rule defaults to alphabetical sorting within groups. This approach is deterministic, requires no subjective formatting decisions, and aligns with standard JavaScript/TypeScript conventions. It directly resolves the flagged violations without altering module semantics.
- *Alternatives Considered:* Grouping by import type (e.g., relative vs. absolute) or maintaining current order with ESLint overrides. Alphabetical sorting was chosen because it is the default ESLint expectation and minimizes configuration drift.

**2. Targeted File-Level Fix vs. Global Auto-Fix**
- *Decision:* Apply changes only to the specific CLI entry file causing the error, using manual verification or scoped auto-fix.
- *Rationale:* The actionable steps show a precise diff affecting only 8 import statements. A global `pnpm run lint --fix` could inadvertently reorder imports in unrelated files or trigger cascading changes. Targeted application ensures minimal diff, predictable CI behavior, and easier review.
- *Alternatives Considered:* Running `eslint --fix` across the entire monorepo. Rejected due to risk of unintended side effects and larger, harder-to-review diffs.

**3. Enforcement via Pre-commit/CI Hooks**
- *Decision:* Rely on existing ESLint configuration and CI pipeline to enforce import ordering going forward.
- *Rationale:* Manual enforcement is error-prone. The project's existing linting setup should already include `--fix` on save or pre-commit hooks. This design assumes those hooks are active and will automatically catch future violations.
- *Alternatives Considered:* Adding a custom ESLint rule or editor configuration. Unnecessary since standard `import/order` rules already cover this use case.

## Risks / Trade-offs

[Risk] Scoped auto-fix or manual reordering might miss adjacent imports or trigger cascading lint errors in dependent files. → [Mitigation] Run `pnpm run lint` on the specific file first, review the generated diff, and verify `pnpm run check` passes before committing.
[Risk] Future developers may add new CLI imports out of order, recreating the violation. → [Mitigation] Ensure ESLint `--fix` is configured in the editor and pre-commit hooks. Document the import ordering convention in the project's contributing guidelines.
[Risk] The `wallet:build` check might have a secondary dependency on the lint output. → [Mitigation] Verify that fixing the lint error alone resolves the build error. If not, investigate build-time import resolution separately.

## Migration Plan

1. **Identify Target File:** Locate the exact CLI module file containing the flagged imports (likely `cli/index.js` or `cli/commands/index.js` based on the diff structure).
2. **Apply Ordering:** Reorder the `./commands/*.js` imports alphabetically as shown in the actionable steps.
3. **Validate Locally:** Run `pnpm run lint` and `pnpm run check` to confirm `devnode-server:lint` and `wallet:build` errors are resolved.
4. **Commit & Push:** Stage the changes, commit with a descriptive message referencing the CI signals, and push to trigger the pipeline.
5. **Rollback Strategy:** If CI fails unexpectedly after the change, revert the commit and investigate whether the ESLint configuration or build pipeline has diverged from the expected state.

## Open Questions

- Are there other CLI or server modules with similar import ordering issues that should be proactively addressed to prevent future CI flakiness?
- Should the ESLint configuration be explicitly updated to enforce import grouping (e.g., separating third-party, internal, and relative imports) to provide clearer structure and prevent future violations?
- Does the `wallet:build` check have a hard dependency on `devnode-server:lint` passing, or is it a separate build artifact that just happens to fail due to shared configuration?
