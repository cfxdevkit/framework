## Context

The precommit pipeline and repo-check validation are currently blocked by two hard lint violations. The `llm-agents` service fails on `lint/suspicious/noAssignInExpressions` in `src/wiki-validate.ts` (line 135), where an assignment is embedded within an expression. The `pi-agent` service fails on an import/export mismatch, indicating misaligned module boundaries or unused/redundant statements. These errors prevent CI from passing and block standard development workflows. The project enforces strict linting to maintain code quality and prevent side-effect ambiguity.

## Goals / Non-Goals

**Goals:**
- Resolve the `noAssignInExpressions` violation in `llm-agents/src/wiki-validate.ts` without altering runtime behavior.
- Correct the import/export mismatch in `pi-agent` to satisfy strict module validation rules.
- Unblock the precommit pipeline and repo-check validation by ensuring `pnpm run lint` passes with zero errors.
- Maintain strict adherence to the project's linting configuration and coding standards.

**Non-Goals:**
- Refactoring unrelated code or addressing other lint warnings/errors.
- Modifying lint rule configurations to bypass the violations.
- Changing runtime logic, performance characteristics, or external APIs.
- Addressing architectural changes or new feature development.

## Decisions

1. **Extract Assignment from Expression (`wiki-validate.ts`)**
   - **Approach:** Isolate the assignment currently embedded in a conditional or logical expression into a standalone declaration preceding the expression.
   - **Rationale:** The linter flags assignments in expressions because they obscure side effects and reduce readability. Extracting the assignment preserves the exact evaluation order and runtime behavior while satisfying the rule. This is safer than attempting to rewrite the expression using alternative patterns (e.g., `matchAll` or separate validation steps), which could introduce subtle behavioral changes.
   - **Alternatives Considered:** 
     - Using `eslint-disable-next-line`: Rejected as it masks the issue and violates the principle of fixing root causes.
     - Rewriting the regex matching logic: Rejected as it adds unnecessary complexity and deviates from the minimal-change remediation scope.

2. **Align Import/Export Statements (`pi-agent`)**
   - **Approach:** Audit the module's import and export declarations to identify the mismatch. Remove unused imports, correct incorrect export syntax, or adjust re-exports to match the actual module structure.
   - **Rationale:** Import/export mismatches often stem from dead code, incorrect barrel file patterns, or TypeScript module resolution quirks. Aligning them ensures clean module boundaries, improves tree-shaking efficiency, and satisfies strict linting rules.
   - **Alternatives Considered:**
     - Disabling the import/export rule: Rejected as it hides potential dead code or broken references.
     - Converting to dynamic imports: Rejected as it is over-engineered for a static lint violation and impacts startup performance.

3. **Manual Verification Over Auto-Fix**
   - **Approach:** Apply fixes manually rather than relying solely on `pnpm run lint --fix`.
   - **Rationale:** Auto-fixers can sometimes introduce formatting inconsistencies or misinterpret complex expressions. Manual correction ensures precision, preserves intentional code structure, and allows for immediate validation of the fix against the specific error signals.

## Risks / Trade-offs

- [Risk] Extracting the assignment may slightly increase code verbosity. → Mitigation: Acceptable trade-off for strict lint compliance and improved readability; the change is localized to a single expression.
- [Risk] Import/export alignment might inadvertently break downstream consumers if the mismatch was part of an intentional re-export pattern. → Mitigation: Verify barrel file exports and module contracts before committing; run integration tests to confirm no broken references.
- [Risk] The lint rule configuration may have been intentionally relaxed for this file. → Mitigation: Cross-reference the project's lint config to confirm rule scope; if the rule is global, the fix is mandatory.

## Migration Plan

1. **Reproduce:** Run `pnpm run lint` locally to confirm the exact error locations and messages.
2. **Implement Fixes:** 
   - Modify `llm-agents/src/wiki-validate.ts` to extract the assignment from the expression.
   - Audit and correct import/export statements in `pi-agent`.
3. **Validate:** Run `pnpm run lint` to verify zero errors. Execute the full test suite to ensure no behavioral regressions.
4. **Commit & Push:** Stage changes, commit with a descriptive message referencing the lint errors, and push to trigger CI.
5. **Rollback Strategy:** Since this is a pure lint remediation with no runtime changes, rollback is straightforward: revert the commit if CI fails unexpectedly or if unexpected regressions are detected.

## Open Questions

- Is the
