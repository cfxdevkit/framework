## Context

The CI pipeline is currently blocked with 2 errors and 1 warning. The `pi-agent:test` suite reports an output mismatch where the `modelPolicies` object now includes an unexpected `"approvalMode": "defer"` field. The `showcase-public:test` suite shows a cached failure, which typically stems from stale baseline data or a direct dependency on the same structural change. The current state requires aligning test expectations with the actual code output to restore pipeline health and unblock downstream development.

## Goals / Non-Goals

**Goals:**
- Unblock CI by resolving `pi-agent` and `showcase-public` test failures.
- Update test snapshots/expectations to accurately reflect the current `modelPolicies` output structure.
- Ensure deterministic test execution across local and CI environments.

**Non-Goals:**
- Refactoring the `modelPolicies` data model or approval workflow logic.
- Modifying unrelated test suites, CI configuration, or deployment pipelines.
- Addressing warnings or passing tests that are not directly impacted by the `approvalMode` mismatch.

## Decisions

**1. Approach: Update Test Expectations vs. Revert Code**
- **Choice:** Update test snapshots/expectations to include `"approvalMode": "defer"`.
- **Rationale:** The introduction of `approvalMode: defer` appears to be a deliberate schema evolution or configuration update. Modifying production code to strip this field would introduce unnecessary churn and risk breaking downstream consumers. Aligning tests with the actual output is the standard remediation path for snapshot mismatches.
- **Alternatives Considered:** Revert the code change that introduced `defer`. *Rejected* because it may undo intentional behavior; test alignment is safer, faster, and preserves the current code state.

**2. Snapshot Update Mechanism**
- **Choice:** Use the test framework's built-in snapshot update flag (e.g., `--update-snapshots` or `UPDATE_SNAPSHOTS=1`) during local validation.
- **Rationale:** Ensures generated expectations are deterministic and match the exact serialization format of the current codebase. Manual edits risk formatting drift and merge conflicts.

**3. Showcase-Public Failure Resolution**
- **Choice:** Treat the cached failure as a direct dependency on the same `modelPolicies` structure. Apply the same snapshot update and verify isolation.
- **Rationale:** Cached failures in CI often stem from stale baseline data. Refreshing the baseline and re-running the suite will confirm whether the failure is resolved or requires separate investigation.

## Risks / Trade-offs

- [Risk] Masking an unintended regression if `defer` was accidentally introduced. → [Mitigation] Cross-reference the commit history for `modelPolicies` to confirm intent. If unintended, revert the code change instead of updating tests.
- [Risk] Snapshot drift causing flaky tests in other environments. → [Mitigation] Pin test data fixtures, ensure deterministic ordering, and run the full suite locally before pushing.
- [Trade-off] Updating snapshots may hide subtle behavioral changes. → [Mitigation] Review the diff of updated snapshots carefully to ensure only the expected `approvalMode` field changed and no other structural drift occurred.

## Migration Plan

1. Identify failing test files in `pi-agent` and `showcase-public` suites.
2. Run `pnpm run test` with the appropriate snapshot update flag to regenerate expectations.
3. Verify the updated snapshots only contain the expected `"approvalMode": "defer"` addition.
4. Run `pnpm run check` to resolve the cached `showcase-public` failure and validate the full suite (target: 9/9 passed, 0 errors).
5. Commit the updated test files/snapshots and push to CI.
6. Monitor CI pipeline for unblock status. Rollback by reverting the snapshot changes if post-merge validation reveals unexpected behavior.

## Open Questions

- Was the `approvalMode: defer` field intentionally added to the `modelPolicies` schema? If not, should we revert the production code change instead of updating tests?
- Are there downstream services or documentation that reference the exact shape of `modelPolicies` and need alignment?
- Does the `showcase-public` cached failure have any additional dependencies beyond the `modelPolicies` structure, or is it purely a snapshot baseline issue?
