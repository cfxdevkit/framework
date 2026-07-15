## Context

The `pi-agent` package currently blocks CI validation with two distinct issues: a failing unit test due to a snapshot mismatch introducing an `approvalMode` field, and a kebab-case naming convention warning for five files in `src/commands`. These issues prevent the package from achieving a passing status (currently 6/9 passed, 2 errors, 1 warning). The change operates within a single package context to resolve both simultaneously while maintaining CI pipeline integrity and adhering to repository-wide standards.

## Goals / Non-Goals

**Goals:**
- Update the failing test snapshot to accurately reflect the new `approvalMode: "defer"` output alongside existing `modelPolicies`.
- Rename `src/commands/repo*.ts` files to strict kebab-case (`repo-actions.ts`, `repo-check.ts`, `repo-commit.ts`, `repo-run.ts`, `repo-status.ts`) and update all internal/external imports.
- Restore `pi-agent` to a fully passing state in CI, eliminating both the test error and the naming warning.

**Non-Goals:**
- Modifying the underlying business logic or runtime behavior of the `repo*` commands.
- Changing the `approvalMode` configuration schema or introducing new feature flags.
- Refactoring other packages, cross-cutting infrastructure, or unrelated test suites.

## Decisions

- **Snapshot Synchronization over Manual Editing:** Use the test runner's update flag (`-u`) to regenerate the snapshot. This ensures the diff accurately captures the new `approvalMode` field without manual JSON manipulation errors or syntax drift.
- **Batch File Renaming with Import Refactoring:** Rename the five `src/commands/repo*.ts` files to kebab-case. All import statements across the `pi-agent` package will be updated atomically using IDE refactoring tools to guarantee consistency.
- **Atomic Change Delivery:** Combine the snapshot update and file renaming into a single change artifact. This prevents intermediate CI states where the package fails either the test suite or the naming convention check, streamlining review and merge.
- **Alternatives Considered:** 
  - *Manual snapshot editing:* Rejected due to higher risk of syntax errors and missing fields.
  - *Phased renaming:* Rejected because it would leave the package in a warning state longer and complicate import tracking across the codebase.
  - *Ignoring `approvalMode` in tests:* Rejected as it would mask a real output change and violate test integrity.

## Risks / Trade-offs

- [Risk] Snapshot update inadvertently accepts unintended output changes → Mitigation: Explicitly review the generated snapshot diff to confirm `approvalMode: "defer"` aligns with recent feature commits and expected runtime behavior before merging.
- [Risk] Broken imports during batch rename → Mitigation: Leverage IDE refactoring tools for import updates and run the full `pnpm run test` suite immediately after renaming to catch any missed references.
- [Trade
