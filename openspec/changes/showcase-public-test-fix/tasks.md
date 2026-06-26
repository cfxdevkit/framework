## 1. Diagnose Test Failure

- [ ] 1.1 Reproduce `showcase-public:test` failure locally using `pnpm run check`
- [ ] 1.2 Analyze cached error output to identify the specific failing assertion or module
- [ ] 1.3 Audit test imports and shared fixtures for unintended `pi-agent` coupling

## 2. Isolate & Fix Dependencies

- [ ] 2.1 Clear stale test runner cache to eliminate caching artifacts
- [ ] 2.2 Decouple `showcase-public` test setup from `pi-agent` shared state or mocks
- [ ] 2.3 Apply targeted code or test fixes to resolve the identified failure

## 3. Verify & Validate

- [ ] 3.1 Run `showcase-public:test` in isolation to confirm independent resolution
- [ ] 3.2 Execute full `pnpm run check` suite to verify no regressions across the 9 tests
- [ ] 3.3 Confirm CI status updates to green with 0 errors and 0 warnings
