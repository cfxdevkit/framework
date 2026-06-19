## Context

The `pi-agent` module currently fails CI validation due to lint errors in `src/wiki-validate.ts`. The pipeline reports a `lint/suspicious/noAssignInExpressions` violation at line 135, typically triggered by assignment within a conditional expression (e.g., `while ((match = regex.exec(str)) !== null)`). Additionally, a missing or incorrectly scoped type import for `StatusReport` causes TypeScript and linting failures. These issues block the `docs-pipeline:lint` stage and violate the project's strict type-safety and formatting standards. This design addresses the remediation outlined in the `fix-lint-pi-agent-imports` proposal, which identifies the lint diff and import mismatch as immediate blockers.

## Goals / Non-Goals

**Goals:**
- Resolve the `noAssignInExpressions` lint violation by refactoring the regex iteration pattern in `src/wiki-validate.ts`.
- Correct the `StatusReport` import path to satisfy TypeScript strict mode and project linting rules.
- Ensure `src/wiki-validate.ts` passes `pnpm run lint` and `pnpm run format` with zero errors and warnings.
- Maintain existing validation logic and runtime behavior while aligning with modern TS/JS best practices.

**Non-Goals:**
- Refactoring the core validation algorithm or business logic within `wiki-validate.ts`.
- Modifying the `StatusReport` type definition or its schema.
- Addressing unrelated lint warnings or formatting issues in other modules.
- Changing CI pipeline configuration or lint rule severity.

## Decisions

- **Regex Iteration Pattern:** Replace the assignment-in-condition pattern with `String.prototype.matchAll()` or an explicit `for` loop using `regex.exec()`. 
  *Rationale:* `matchAll()` is the modern, side-effect-free standard for global regex iteration in TypeScript. It eliminates implicit `lastIndex` mutation, aligns with the `noAssignInExpressions` rule, and improves readability. If `lastIndex` state was previously relied upon, we will explicitly reset it or use `Array.from(str.matchAll(regex))` to guarantee deterministic behavior.

- **Type Import Resolution:** Locate the canonical export path for `StatusReport` within the project's type definitions or barrel files. Use a strict named import (`import type { StatusReport } from '...'`) to satisfy the project's linting configuration for type-only imports.
  *Rationale:* Explicit type imports prevent runtime pollution, satisfy `verbatimModuleSyntax` or equivalent TS configs, and ensure the linter can correctly resolve the symbol without ambiguity.

- **Formatting Enforcement:** Run the project's formatter immediately after logical changes, rather than relying on IDE auto-format or manual adjustments.
  *Rationale:* Automated formatting guarantees compliance with whitespace, line-length, and syntax rules defined in the project's config, preventing formatting drift and reducing review friction.

## Risks / Trade-offs

- [Risk] Transitioning from `regex.exec()` to `matchAll()` may alter iteration behavior if the original code relied on `lastIndex` state for partial matches or stateful parsing. → [Mitigation] Audit `wiki-validate.ts` for `lastIndex` usage. If present, explicitly reset `regex.lastIndex = 0` before iteration or switch to `Array.from(str.matchAll(regex))` to isolate state.
- [Risk] Incorrect `StatusReport` import path could cause build failures or introduce circular dependencies. → [Mitigation] Cross-reference existing imports in the `pi-agent` module, verify against `tsconfig` paths, and confirm barrel exports before committing. Run `pnpm run typecheck` locally to catch resolution errors early.
- [Risk] Over-aggressive lint fixes might inadvertently change edge-case matching behavior. → [Mitigation] Run existing unit tests for `wiki-validate.ts` post-fix to validate that regex matching outcomes remain identical.

## Migration Plan

1. **Reproduce:** Run `pnpm run lint` locally to confirm the exact error locations in `src/wiki-validate.ts`.
2. **Implement:** Refactor the regex iteration pattern, correct the `StatusReport` import, and run the formatter.
3. **Validate:** Execute `pnpm run lint` and `pnpm run typecheck` to ensure zero errors/warnings. Run relevant unit tests to verify behavioral parity.
4. **Commit & Push:** Create a PR targeting the main branch with a clear description of the lint remediation.
5. **Rollback:** If CI fails post-merge due to unexpected runtime behavior, revert the commit and investigate the regex iteration change. The fix is isolated to a single file, making rollback low-risk.

## Open Questions

- Does the current regex iteration in `wiki-validate.ts` rely on `lastIndex` for partial matches or stateful parsing? If so, what is the exact fallback pattern to preserve behavior?
- Is `StatusReport` intended to be imported from a shared `@repo/types` package, or should it be defined locally within `pi-agent`? Clarification from the module owner is recommended before finalizing the import path.
- Are there any downstream consumers of `wiki-validate.ts` that expect specific regex match object shapes? If so, we may need to adapt the return type to ensure compatibility.
