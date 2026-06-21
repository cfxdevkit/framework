## Context

The `pi-agent` module is currently failing CI validation due to snapshot mismatches in test outputs. Specifically, the expected test fixtures lack the `approvalMode: "defer"` field and the nested `modelPolicies` structure that the runtime now emits. Concurrently, the `kebab-groups` linter flags five `repo*.ts` command files in `src/commands` that violate the project's kebab-case naming convention. These structural and test alignment issues also propagate a cached signal error to `showcase-public:test`. The current state requires both test expectation alignment and a modular refactoring of command files. Constraints include maintaining backward compatibility for internal imports, adhering to kebab-case standards, and ensuring atomic delivery to prevent intermediate CI failures.

## Goals / Non-Goals

**Goals:**
- Align `pi-agent` test snapshots with the expected `approvalMode: "defer"` and `modelPolicies` structure.
- Consolidate and rename the five `repo*.ts` files into `repo-actions.ts`, `repo-check.ts`, `repo-commit.ts`, `repo-run.ts`, and `repo-status.ts` to satisfy kebab-case conventions.
- Resolve the cached signal propagation to `showcase-public:test` by ensuring clean test execution post-refactor.
- Package both changes into a single atomic commit to reduce implementation risk and ensure test and file structure updates are applied together.

**Non-Goals:**
- Modifying the core business logic or runtime behavior of `approvalMode` or `modelPolicies`.
- Refactoring unrelated command files, services, or infrastructure outside `pi-agent`.
- Changing the public API contract or external integrations.
- Implementing new test coverage or expanding test suites beyond fixing the current mismatches.

## Decisions

- **Snapshot Alignment vs. Runtime Modification:** We will update the test snapshots/fixtures to explicitly include `approvalMode: "defer"` and the nested `modelPolicies` object. *Rationale:* The runtime already emits these fields; aligning tests with the actual output is safer and faster than modifying the runtime contract. *Alternative considered:* Stripping these fields from the runtime output. *Rejected:* Would break downstream consumers, deviate from the intended configuration model, and introduce unnecessary runtime complexity.
- **File Consolidation Strategy:** The five `repo*.ts` files will be split/renamed into dedicated kebab-case modules, with a centralized barrel export (`index.ts`) re-exporting them for backward compatibility. *Rationale:* Enforces the kebab-groups rule while minimizing breakage for existing import statements. *Alternative considered:* Renaming existing files in place or merging them into a single file. *Rejected:* In-place renaming causes unnecessary git history churn; merging reduces modularity and violates the explicit grouping requirement.
- **Atomic Change Delivery:** Both test updates and file restructuring will be committed together. *Rationale:* Prevents intermediate states where tests fail due to missing fields or imports break due to renamed files. Ensures CI validation passes as a single unit and simplifies rollback.

## Risks / Trade-offs

- [Risk] Snapshot updates may mask subtle behavioral regressions if tests are not carefully reviewed. → [Mitigation] Perform a line-by-line diff of the snapshot changes to verify they reflect intentional state updates, not accidental drift. Cross-reference with runtime output before committing.
- [Risk] Import path changes across the codebase could cause runtime resolution errors. → [Mitigation] Update all internal imports systematically and run the full `pnpm run test` suite before merging. Use TypeScript's strict module resolution to catch broken paths early.
- [Risk] Cached signals in `showcase-public:test` may persist post-fix. → [Mitigation] Clear CI build caches and force a fresh test run to invalidate stale signal pointers. Document cache-clearing steps in the migration plan.
- [Risk] Barrel export re-exports may introduce circular dependencies if not structured carefully. → [Mitigation] Keep barrel exports shallow and avoid importing from the barrel within the same module. Validate with `tsc --noEmit` before running tests.

## Migration Plan

1. **Preparation:** Clone the branch and run `pnpm run test` to capture current failure signals and document the exact snapshot diff.
2. **Test Fix:** Update `pi-agent` test fixtures/snapshots to include `approvalMode: "defer"` and the full `modelPolicies` structure. Verify against the runtime output to ensure accuracy.
3. **File Restructuring:** Rename/split `src/commands/repo*.ts` into the five target kebab-case files. Update the barrel export (`index.ts`) to re-export from the new modules.
4. **Import Updates:** Scan the `pi-agent` codebase for references to the old filenames and update imports to use the new kebab-case paths or the barrel export.
5. **Validation:** Run `pnpm run test` and `pnpm run check`. Clear any CI caches if `showcase-public:test` still reports cached signals. Confirm all 9 checks pass.
6. **Deployment:** Commit all changes atomically. Merge to main. Rollback strategy: Revert the commit if CI validation fails post-merge or if runtime errors surface in staging.

## Open Questions

- Are there external tooling, scripts, or downstream packages that directly import the old `repo*.ts` filenames outside the `pi-agent` module?
- Should `approvalMode` be parameterized in test fixtures to support multiple modes, or is `"defer"` sufficient for the current test scope?
- Does the kebab-case consolidation require updating any TypeScript path aliases, module resolution configs, or IDE workspace settings?
- Is there a formal deprecation window required for the old import paths before removing the barrel re-exports?
