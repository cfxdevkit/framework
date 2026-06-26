## Context

The repository's automated check pipeline is currently failing with 5 errors across three core packages: `tooling-cli`, `cli`, and `llm-agents`. The failures stem from linting violations (unorganized imports), TypeScript compilation errors (unused variable `iFK` in `keystore.ts`), missing module exports (`repoCheckCommand`), and a critical code quality hotspot (`keystore.ts` at 590 lines). These issues block CI/CD progression, degrade developer experience, and violate the project's strict type-checking and code quality gates. The current validation status shows 3/9 checks passing, with 1 warning and 5 errors.

## Goals / Non-Goals

**Goals:**
- Resolve all lint, typecheck, and build errors to restore the repo check pipeline to a passing state (9/9).
- Apply Biome's safe fix to organize imports and exports in `tooling-cli`.
- Audit and resolve the TS6133 unused variable `iFK` in `cli/src/commands/keystore.ts`.
- Correct the missing export for `repoCheckCommand` in `llm-agents/workers/agents/check/types.ts`.
- Initiate incremental refactoring of the 590-line `keystore.ts` to reduce complexity and address the hard hotspot.

**Non-Goals:**
- Complete rewrite or architectural overhaul of `keystore.ts`.
- Addressing soft hotspots in other files (`commit.ts`, `page.tsx`).
- Modifying external dependencies, core data models, or public API contracts beyond what is strictly necessary to fix the errors.

## Decisions

- **Import Organization Strategy:** Leverage Biome's built-in safe fix (`organize imports and exports`) for `tooling-cli`. This automates sorting, removes duplicates, and enforces consistent formatting without manual intervention.
- **Unused Variable Resolution (`iFK`):** Audit the declaration at `keystore.ts:413`. If the variable serves no current or near-term purpose, remove it. If it is a deliberate placeholder for future logic, prefix with `_` (`_iFK`) to suppress TS6133 while explicitly signaling intentional omission. This maintains strict type checking without introducing dead code.
- **Missing Export Correction:** Update `llm-agents/workers/agents/check/types.ts` to explicitly export `repoCheckCommand`. Ensure the export aligns with the module's public API contract and is properly typed. If consumed via barrel files, add a re-export to maintain consistency.
- **Incremental Hotspot Refactoring:** Instead of a monolithic rewrite, apply the "Extract Module" pattern to `keystore.ts`. Split the file into domain-specific modules (e.g., `keystore-commands.ts` for CLI handlers, `keystore-io.ts` for file operations, `keystore-utils.ts` for shared logic). This reduces cognitive load, lowers the line count, and isolates change boundaries while preserving existing functionality.

## Risks / Trade-offs

- [Risk] Removing or prefixing `iFK` may inadvertently discard planned functionality. → [Mitigation] Cross-reference recent commit history and issue trackers; add a `// TODO: [ISSUE]` comment if retention is uncertain.
- [Risk] Refactoring a 590-line file introduces regression risk due to hidden coupling or implicit dependencies. → [Mitigation] Extract logic incrementally, run targeted unit tests after each extraction, and use IDE-assisted refactoring to preserve references. Keep changes scoped to one logical module per commit.
- [Risk] Auto-organizing imports may alter file diffs, making code review noisier. → [Mitigation] Run the formatter post-fix and squash changes into a single logical commit. Use `git diff --ignore-all-space` during review if needed.

## Migration Plan

1. **Lint Fix:** Navigate to `tooling-cli`, run `pnpm run lint`, and apply the Biome safe fix. Verify import organization matches project style.
2. **Typecheck Fix:** Open `cli/src/commands/keystore.ts`, audit line 413, and remove/refix `iFK`. Run `pnpm run typecheck` to confirm TS6133 resolution.
3. **Build Fix:** Update `llm-agents/workers/agents/check/types.ts` to export `repoCheckCommand`. Run `pnpm run build` to confirm the missing export error is resolved.
4. **Hotspot Mitigation:** Extract the CLI command handler logic from `keystore.ts` into a new `keystore-commands.ts` module. Update imports accordingly and verify compilation.
5. **Validation:** Execute `pnpm run check` and `pnpm run cdk -- repo check hotspots -- --fail-on-hard` to verify all 9 checks pass and the hard hotspot score is reduced.
6. **Rollback:** If pipeline validation fails or regressions are detected, revert the PR and isolate the failing change for targeted debugging.

## Open Questions

- Is `iFK` a legacy artifact or a deliberate placeholder for upcoming key derivation logic?
- What is the target line count threshold for `keystore.ts` to be considered "soft" or "clean" by project standards?
- Should `repoCheckCommand` be re-exported from a central `llm-agents/src/index.ts` barrel file for consistency across the workspace?
