## Context

The `llm-agents` service enforces a strict linting pipeline that includes the `lint/suspicious/noAssignInExpressions` rule. This rule flags assignments embedded directly within expressions (e.g., conditionals, loops, or ternaries) because they can obscure side effects and reduce code readability. Currently, `src/wiki-validate.ts` contains such an assignment around line 135, causing a cached lint error that blocks the validation pipeline (6/9 passed, 2 errors). The codebase prioritizes explicit, side-effect-free expressions to maintain consistency and prevent subtle bugs in validation logic.

## Goals / Non-Goals

**Goals:**
- Resolve the `noAssignInExpressions` lint error in `src/wiki-validate.ts` at line 135.
- Restore the lint pipeline to a fully passing state without altering runtime behavior.
- Maintain existing validation semantics and regex matching logic.

**Non-Goals:**
- Refactor the broader `wiki-validate.ts` module or introduce new architectural patterns.
- Modify the lint configuration or disable the rule project-wide.
- Address other lint warnings or errors outside this specific violation.

## Decisions

- **Extract Assignment from Expression**: Move the assignment to a standalone statement preceding the conditional or loop. This directly satisfies the lint rule's intent by separating side effects from expression evaluation.
  - *Rationale*: Inline assignments in expressions are a known source of readability issues and accidental short-circuiting. Extracting them makes data flow explicit and aligns with the project's lint policy.
  - *Alternatives Considered*: 
    - Inline rule disable (`// eslint-disable-next-line`): Rejected as it masks potential side-effect risks and violates the project's strict lint posture.
    - Using `void` or utility wrappers: Rejected as they add unnecessary indirection without improving clarity.

- **Preserve Scope and Truthiness Checks**: Ensure the extracted variable maintains the exact same lexical scope and truthiness evaluation as the original expression.
  - *Rationale*: Validation logic often relies on truthy/falsy checks for match results. Extracting the assignment must not alter control flow or break existing tests.

- **Minimal Diff Scope**: Limit changes to the specific line(s) triggering the error.
  - *Rationale*: Reduces review overhead, minimizes risk of introducing regressions, and aligns with the remediation nature of this change.

## Risks / Trade-offs

[Risk] Extracting the assignment may slightly increase line count or change variable hoisting behavior in edge cases. → Mitigation: Verify that the extracted variable is declared in the same scope and that lint/type checks pass locally before committing.
[Risk] Cached lint state may persist after the fix, causing false negatives in CI. → Mitigation: Clear the lint cache (`pnpm run lint -- --reset` or equivalent) during local validation and ensure CI runs a fresh lint pass.
[Risk] Short-circuit evaluation behavior might differ if the original expression relied on assignment side effects for control flow. → Mitigation: Review surrounding logic to confirm that truthiness checks remain equivalent; add or update unit tests if control flow depends on match results.

## Migration Plan

1. Apply the extracted assignment pattern to `src/wiki-validate.ts` at line 135.
2. Run `pnpm run lint` locally to verify the error is resolved and no new warnings are introduced.
3. Clear lint cache if necessary and re-run validation.
4. Commit the change and push to trigger the CI pipeline.
5. Rollback strategy: Revert the commit if the pipeline fails, tests break, or runtime validation behavior changes unexpectedly.

## Open Questions

- Are there other instances of assignment-in-expression patterns in the `llm-agents` codebase that should be addressed proactively in a follow-up cleanup?
- Does the validation logic rely on any specific regex state (`lastIndex`) that could be affected by extracting the assignment? (If so, explicit `regex.exec()` vs `string.match()` behavior must be verified.)
