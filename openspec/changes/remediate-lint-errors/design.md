## Context

The precommit quality gate is currently failing due to two strict lint errors across the `llm-agents` and `pi-agent` packages. The CI pipeline reports a status of `error` with 6/9 checks passing, 1 warning, and 2 errors. The first error originates from `llm-agents/src/wiki-validate.ts:135`, where the linter flags a `noAssignInExpressions` violation. The second error stems from `pi-agent`, where a stale format and type mismatch exists between `RunGenerateOptions` and `StatusReport`. These violations block the quality gate, preventing merges and obscuring genuine regressions. The codebase uses a strict linting configuration that treats these patterns as errors, requiring explicit separation of assignment logic and type alignment to pass.

## Goals / Non-Goals

**Goals:**
- Restore the precommit quality gate to a passing state by resolving the two reported lint errors.
- Refactor the assignment expression in `wiki-validate.ts` to comply with the `noAssignInExpressions` rule without altering runtime behavior.
- Align `pi-agent` type definitions and formatting to eliminate the stale mismatch in `RunGenerateOptions`/`StatusReport`.
- Ensure fixes are isolated, deterministic, and reproducible via `pnpm run lint`.

**Non-Goals:**
- Refactoring unrelated modules or introducing new architectural patterns.
- Changing runtime logic, API contracts, or external dependencies.
- Addressing lint warnings, formatting inconsistencies outside the flagged files, or broader codebase hygiene improvements.
- Modifying CI pipeline configuration or linter rule definitions.

## Decisions

**1. Extract Assignment from Expression in `wiki-validate.ts`**
- **Approach:** Split the flagged expression at line 135 into a separate declaration and assignment statement. Instead of embedding the assignment within a conditional or return expression, the match result will be captured first, then evaluated.
- **Rationale:** The `noAssignInExpressions` rule exists to prevent hidden side effects and improve readability. Extracting the assignment makes the control flow explicit, satisfies the linter, and preserves the exact execution order. This avoids introducing temporary variables or changing the function signature.
- **Alternatives Considered:** 
  - Disabling the rule via inline comment: Rejected as it masks the pattern and violates project linting standards.
  - Rewriting with a helper function: Rejected as it adds unnecessary abstraction for a simple regex match extraction.

**2. Synchronize `pi-agent` Type Definitions and Formatting**
- **Approach:** Audit `RunGenerateOptions` and `StatusReport` to identify the source of the stale mismatch. Update type signatures to reflect current runtime expectations, then run the project formatter to sync whitespace and structure.
- **Rationale:** Stale type mismatches typically arise from divergent development branches or incomplete refactors. Aligning the types ensures compile-time safety and eliminates the lint error. Formatting synchronization prevents secondary failures from the same commit.
- **Alternatives Considered:**
  - Using `any` or `unknown` to bypass the mismatch: Rejected as it degrades type safety and violates strict linting policies.
  - Patching the linter config to ignore the specific file: Rejected as it creates a precedent for bypassing quality gates.

**3. Validate via Monorepo Lint Scripts**
- **Approach:** Run `pnpm run lint` in both `llm-agents` and `pi-agent` directories post-fix, and verify the precommit hook passes locally before pushing.
- **Rationale:** Ensures fixes are applied in the exact environment where CI runs, catching version or cache discrepancies early. Cached lint results will be invalidated to guarantee accurate reporting.

## Risks / Trade-offs

[Risk] Extracting the assignment may expose an unintended side effect if the original expression relied on implicit evaluation order. → Mitigation: Verify the assignment expression is purely a value capture with no side effects. If side effects exist, refactor to an explicit statement block with clear documentation.
[Risk] Type alignment in `pi-agent` could break downstream consumers if `RunGenerateOptions` or `StatusReport` were intentionally loosely typed. → Mitigation: Review usage sites across the codebase, ensure backward compatibility, and run the full test suite before merging.
[Risk] Linter or formatter version drift between local and CI environments could cause false positives. → Mitigation: Pin tool versions in `package.json`, clear lint caches (`pnpm run lint --force`), and verify against the exact CI runner image.
[Risk] Over-focusing on lint compliance may obscure legitimate code complexity. → Mitigation: Keep changes minimal and scoped strictly to the flagged violations. Add inline comments only if the linter rule conflicts with a documented business requirement.

## Migration Plan

1. **Reproduce:** Run `pnpm run lint` in `llm-agents` and `pi-agent` to confirm the exact error signals and clear caches.
2. **Apply Fixes:** 
   - Refactor `wiki-validate.ts:135` to separate assignment from expression.
   - Update `pi-agent` type definitions to resolve the `RunGenerateOptions`/`StatusReport` mismatch.
   - Run formatters to sync formatting.
3. **Validate:** Execute `pnpm run lint` in both packages. Confirm zero errors and that the precommit hook passes.
4. **Test:** Run the full test suite for both packages to ensure no behavioral regressions.
5. **Commit & Push:** Stage changes, commit with a descriptive message referencing the lint errors, and push to trigger CI.
6. **Monitor:** Watch CI for the `docs-pipeline:lint` status. If it fails unexpectedly, revert the commit and investigate environment differences.
7. **Rollback:** If CI remains red after troubleshooting, revert the commit and apply fixes incrementally with targeted rule disables only if explicitly approved by maintainers.

## Open Questions

- Does the assignment expression at `wiki-validate.ts:135` contain any implicit side effects that require explicit handling after extraction?
- What is the exact origin of the `RunGenerateOptions`/`StatusReport` type mismatch? Was it introduced by a recent refactor, or is it a legacy divergence that requires broader alignment?
- Are there any downstream packages or integration tests that consume these types and may need version bumps or compatibility checks?
