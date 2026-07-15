## 1. Investigation & Root Cause Analysis

- [ ] 1.1 Reproduce the `showcase-public:test` cached check error locally using `pnpm run check`
- [ ] 1.2 Inspect test runner cache configuration and stale state artifacts to identify the failure trigger
- [ ] 1.3 Verify the error is isolated to `showcase-public:test` and does not impact `devnode-server:test` or `pi-agent`

## 2. Cache & Configuration Remediation

- [ ] 2.1 Clear local and CI test caches to reset the check state and eliminate stale data
- [ ] 2.2 Update test configuration or cache invalidation rules to prevent future cached check errors
- [ ] 2.3 Apply targeted code or fixture adjustments if cached state is causing assertion mismatches

## 3. Validation & Regression Testing

- [ ] 3.1 Execute `pnpm run check` to confirm `showcase-public:test` passes without cache-related errors
- [ ] 3.2 Run `pnpm run test` to ensure `devnode-server:test` and other suites remain stable and unaffected
- [ ] 3.3 Verify final status shows 0 errors and 0 warnings, confirming full remediation
