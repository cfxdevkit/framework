## 1. Investigate Output Mismatch

- [ ] 1.1 Locate the code path generating `modelPolicies` in pi-agent
- [ ] 1.2 Determine if `approvalMode: "defer"` is a new baseline or unintended regression
- [ ] 1.3 Identify affected test files in pi-agent and showcase-public

## 2. Update Test Expectations

- [ ] 2.1 Update pi-agent test snapshots to include `approvalMode: "defer"` in modelPolicies
- [ ] 2.2 Update showcase-public test expectations to match the aligned modelPolicies structure
- [ ] 2.3 Remove cached test artifacts to force fresh validation runs

## 3. Validate Fixes

- [ ] 3.1 Run `pnpm run test` to verify pi-agent:test passes without output mismatch
- [ ] 3.2 Run `pnpm run check` to verify showcase-public:test passes without cached failure
- [ ] 3.3 Execute full validation suite to confirm 9/9 tests pass and 0 errors remain
