## Context

The `showcase-public:test` suite is currently failing in the CI pipeline with a cached error, blocking downstream development and merging. The failure is exacerbated by tight coupling with `pi-agent` test execution, causing independent failures when `pi-agent` changes are introduced. Current validation shows a status of `error` with 6/9 tests passing, 1 warning, and 2 errors. The actionable signal indicates a cached failure (`45c749b9`) that reproduces via `pnpm run check`. The root cause appears to be stale test state, environment leakage, or implicit dependencies on `pi-agent` runtime context rather than a fundamental logic defect. This coupling increases implementation risk and slows the feedback loop for both services.

## Goals / Non-Goals

**Goals:**
- Isolate `showcase-public:test` from `pi-agent` execution context to prevent state leakage and coupling.
- Resolve the cached test failure by identifying and fixing the underlying environment or dependency issue.
- Ensure deterministic, independent test execution that passes reliably in CI.
- Restore CI pipeline stability to a green status (9/9 passed, 0 errors).

**Non-Goals:**
- Refactoring `pi-agent` core logic or test infrastructure.
- Addressing other unrelated test failures or warnings in the suite.
- Modifying production code outside the test boundaries.
- Implementing a full test framework overhaul or migrating to a different runner.

## Decisions

- **Isolate Test Execution Context:** Run `showcase-public:test` in a dedicated CI job with a clean workspace and explicit, scoped cache keys.
  *Rationale:* Prevents state leakage from `pi-agent` and eliminates cached error propagation. A shared workspace introduces coupling risk that directly caused this failure.
  *Alternatives considered:* Shared CI workspace (rejected due to coupling), full pipeline restructure (rejected due to scope and maintenance overhead).

- **Explicit Mocking over Shared State:** Replace implicit dependencies on `pi-agent` runtime state with explicit mocks/stubs in the test setup.
  *Rationale:* Ensures deterministic results regardless of external service state or `pi-agent` version drift. Coupling to live or shared state is the primary driver of flakiness.
  *Alternatives considered:* Integration testing with live services (rejected due to flakiness and environment complexity), proxy-based testing (rejected due to added infrastructure cost).

- **Targeted Cache Invalidation:** Implement a pre-execution cache-clearing step specifically for `showcase-public` artifacts before test execution.
  *Rationale:* Directly addresses the "cached error" signal without impacting other jobs or causing global CI slowdowns.
  *Alternatives considered:* Global cache purge (rejected due to CI latency), disabling caching entirely (rejected due to build time impact).

- **Local Reproduction Mandate:** Require `pnpm run check` to pass locally before CI submission, with explicit error logging captured in the PR description.
  *Rationale:* Catches environment-specific issues early, reduces CI feedback loop, and ensures the fix is reproducible outside the pipeline.

## Risks / Trade-offs

- [Risk] Over-isolation may hide integration defects between `showcase-public` and `pi-agent`. → [Mitigation] Maintain a separate, lightweight integration test suite that explicitly validates the boundary contract and runs on a scheduled basis.
- [Risk] Frequent cache invalidation could increase CI execution time. → [Mitigation] Use content-based cache keys (e.g., lockfile hash, test config hash) and only invalidate when dependencies or test setup change.
- [Risk] Mock drift as `pi-agent` evolves, leading to false positives. → [Mitigation] Implement contract tests at the service boundary and schedule periodic mock synchronization reviews aligned with `pi-agent` release cycles.
- [Risk] Local environment differences may mask CI-specific failures. → [Mitigation] Containerize the test environment using a consistent base image and document exact Node/pnpm versions in the project configuration.

## Migration Plan

1. **Reproduce & Diagnose:** Run `pnpm run check` locally to capture the exact error stack, identify the root cause of the cached failure, and verify environment consistency.
2. **Apply Test Fixes:** Update test setup files, replace coupled dependencies with explicit mocks, and resolve any stale state or configuration references.
3. **Update CI Configuration:** Modify the pipeline to run `showcase-public:test` in an isolated job with dedicated cache keys, a pre-execution cache clear step, and explicit environment variables.
4. **Validate:** Run the full suite locally and in CI. Confirm status is green (9/9 passed, 0 errors, 0 warnings).
5. **Deploy & Monitor:** Merge changes and monitor the first 3 CI runs for flakiness or regression.
6. **Rollback Strategy:** Revert CI configuration changes and test file modifications via a single revert commit if failures persist, flakiness increases, or CI latency exceeds acceptable thresholds.

## Open Questions

- What is the exact root cause of the cached error (e.g., stale build artifacts, environment variable mismatch, dependency version drift, or test runner configuration)?
- Are there other test suites in the repository exhibiting similar coupling patterns that should be prioritized for isolation in future remediation cycles?
- Should we implement a dedicated CI artifact for `showcase-public` test outputs to improve debugging visibility and reduce reliance on cached logs?
