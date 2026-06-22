## Context

The `showcase-public` module's test suite is currently failing in CI with a "cached check error". This failure occurs independently of the `pi-agent` pipeline, indicating a localized caching or state management issue within the `showcase-public` validation step. The CI runner is incorrectly reusing a stale cache state, causing the check to fail without executing the actual test logic. The current validation context shows 6/9 tests passing, 1 warning, and 2 errors, with the cached check error being the primary blocker. Isolating this remediation prevents cross-contamination with other failing pipelines and allows targeted, low-risk fixes.

## Goals / Non-Goals

**Goals:**
- Identify and resolve the root cause of the cached check error in `showcase-public:test`.
- Ensure the test suite runs deterministically without relying on stale or incorrectly scoped cache states.
- Update CI configuration to properly invalidate, scope, or version caches for this module.
- Validate that the fix restores full pipeline stability without impacting unrelated services.

**Non-Goals:**
- Addressing unrelated `pi-agent` test failures or approval mode changes.
- Refactoring the broader CI/CD architecture or test runner framework.
- Modifying test assertions, business logic, or contract definitions within `showcase-public`.
- Implementing long-term cache optimization strategies beyond the immediate remediation.

## Decisions

- **Decision 1: Cache Scope & Invalidation Strategy**
  *Choice:* Implement explicit cache key versioning and path scoping for `showcase-public` instead of relying on global or shared cache keys.
  *Rationale:* The cached check error strongly suggests a shared cache is being incorrectly reused across pipeline runs, branches, or dependency updates. Scoping caches to the module and versioning keys ensures stale states are purged automatically when relevant files change.
  *Alternatives Considered:* Manual cache clearing via CI UI (rejected: not reproducible or sustainable at scale). Global cache reset (rejected: impacts other pipelines and increases overall CI latency).

- **Decision 2: Test Isolation & State Management**
  *Choice:* Enforce strict test isolation by resetting shared fixtures, mock states, and environment variables before each test run.
  *Rationale:* Cached check errors often stem from tests depending on residual state from previous runs or parallel executions. Isolating state ensures deterministic execution regardless of cache behavior and prevents cross-test pollution.
  *Alternatives Considered:* Relying solely on CI cache configuration (rejected: does not address potential test-level state leakage or flaky dependencies).

- **Decision 3: CI Configuration Update Approach**
  *Choice:* Update the CI workflow to explicitly clear or bypass the cache during the initial validation run, then re-enable caching with the new scoping strategy.
  *Rationale:* Guarantees a clean slate to verify the fix, then optimizes subsequent runs. This phased approach reduces the risk of introducing new cache misses while confirming the root cause is resolved.
  *Alternatives Considered:* Incremental cache tuning (rejected: higher risk of lingering stale state and prolonged debugging cycles).

## Risks / Trade-offs

- [Risk] Initial cache clearing may increase CI execution time for the first run after deployment. → [Mitigation] Cache will rebuild incrementally; subsequent runs will return to baseline performance. Monitor run durations post-deployment and adjust thresholds if necessary.
- [Risk] Over-scoping caches could lead to cache misses and slower feedback loops. → [Mitigation] Use precise cache keys based on dependency lockfiles and test configuration hashes rather than broad branch names. Validate cache hit rates in staging.
- [Risk] Test isolation changes might mask underlying flaky tests or hidden dependencies. → [Mitigation] Run the full suite in a clean environment before merging to ensure no hidden dependencies are exposed. Add explicit cleanup hooks if state leakage is detected.

## Migration Plan

1. **Pre-deployment Analysis:** Verify the exact cache paths, keys, and runner state used by `showcase-public:test`. Document current behavior and reproduce the cached check error locally if possible.
2. **Configuration Update:** Apply cache scoping and key versioning changes to the CI workflow. Implement test isolation fixes if state leakage is confirmed during analysis.
3. **Validation:** Trigger a manual CI run with cache disabled to confirm the error is resolved. Re-enable caching and verify subsequent runs pass consistently.
4. **Deployment:** Merge changes to the main branch. Monitor the next 3-5 pipeline runs for stability, cache hit rates, and execution times.
5. **Rollback:** If the fix introduces regressions or performance degradation, revert the CI configuration changes and restore the previous cache strategy. Manual cache clearing can be used as an emergency stopgap if needed.

## Open Questions

- What is the exact mechanism triggering the "cached check error" (e.g., CI runner state, test runner cache, or external service mock)?
- Are there any shared global fixtures, environment variables, or network mocks that `showcase-public` tests depend on, which might be causing state collisions?
- Should the cache invalidation strategy be standardized across other modules to prevent similar issues in the future?
- Is there a dependency update or configuration drift that consistently breaks the current cache key generation logic?
