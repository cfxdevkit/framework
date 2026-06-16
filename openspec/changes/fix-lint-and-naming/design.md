## Context

The repository's automated quality gates (`repo-check`) are currently failing due to two lint errors and one naming convention warning. These issues span five modules: `llm-agents`, `pi-agent`, `tooling-cli`, `arch-check`, and `cfx-ui`. The failures block CI/CD progression and reduce codebase consistency. This design outlines the technical approach to resolve these specific signals in a single, low-risk remediation pass, ensuring all quality gates pass without introducing behavioral changes.

## Goals / Non-Goals

**Goals:**
- Resolve the `noAssignInExpressions` lint error in `llm-agents/src/wiki-validate.ts` (line 135).
- Remove the unused `StatusReport` type and resolve formatting diffs in `pi-agent`.
- Rename 5 group identifiers across `tooling-cli`, `arch-check`, `llm-agents`, `pi-agent`, and `cfx-ui` to comply with the kebab-case naming convention.
- Ensure `pnpm run lint` and `pnpm run check` pass without errors or warnings.

**Non-Goals:**
- Refactoring unrelated logic, introducing new dependencies, or modifying runtime behavior.
- Addressing other lint warnings or formatting inconsistencies outside the specified signals.
- Changing public APIs or external-facing interfaces.

## Decisions

- **Extract Assignment from Expression:** The `noAssignInExpressions` rule flags assignments used within larger expressions because they can obscure side-effects and reduce readability. We will refactor line 135 of `wiki-validate.ts` to separate the assignment into its own statement or standard `if` block. This satisfies the lint rule while preserving the original logic and control flow.
- **Dead Code Removal & Formatting Alignment:** The `StatusReport` type in `pi-agent` is flagged as unused. We will remove the type definition and any dangling imports. Concurrently, we will run the project formatter to resolve the formatting diff. This reduces cognitive load and enforces consistent style without altering functionality.
- **Kebab-Case Group Renaming:** The repo enforces kebab-case for group identifiers to maintain cross-module consistency. We will systematically rename the 5 flagged groups across the five modules. We will use IDE-assisted refactoring to ensure all references, type exports, and internal usages are updated atomically, preventing broken imports or type mismatches.

## Risks / Trade-offs

- [Risk] Renaming groups may inadvertently break external configuration files or downstream tooling that expects the original casing. → [Mitigation] Perform a repository-wide search for the old group names before committing. Verify that no external configs, documentation, or CI scripts reference them. Run full type-checking across all affected modules.
- [Risk] Formatting changes may introduce large, noisy diffs that obscure the actual logic fixes. → [Mitigation] Isolate formatting changes to the specific files mentioned. If the diff becomes unwieldy, we can split the commit, but for this low-risk pass, grouping them aligns with the remediation goal.
- [Risk] Extracting the assignment in `wiki-validate.ts` might slightly alter execution order if the original expression relied on short-circuit evaluation. → [Mitigation] Review the surrounding code to ensure the extracted assignment does not change control flow. If short-circuiting was intentional, we will preserve it using explicit `&&` or `||` operators instead of assignment.

## Migration Plan

1. **Reproduce:** Run `pnpm run lint` and `pnpm run check` to confirm the exact failure signals and baseline state.
2. **Fix Lint Error:** Modify `llm-agents/src/wiki-validate.ts:135` to extract the assignment from the expression per the decided approach.
3. **Clean Up Pi-Agent:** Remove the unused `StatusReport` type and run the formatter to resolve diffs.
4. **Apply Naming Convention:** Rename the 5 group identifiers across `tooling-cli`, `arch-check`, `llm-agents`, `pi-agent`, and `cfx-ui` to kebab-case using safe refactoring tools.
5. **Validate:** Run `pnpm run lint` and `pnpm run check` again. Verify that `repo-check` passes with 9/9 checks green.
6. **Commit & Deploy:** Commit the changes and push to trigger the pipeline.
7. **Rollback:** If unexpected breakages occur, revert the commit and investigate the specific module before re-attempting.

## Open Questions

- Are there any external integrations or documentation that explicitly reference the old group names, requiring coordinated updates outside this codebase change?
- Should the kebab-case convention be enforced via a stricter lint rule or automated codemod in the future to prevent regression?
