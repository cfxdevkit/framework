## 1. Fix pi-agent Test Snapshots

- [ ] 1.1 Update pi-agent test snapshot to include `approvalMode: "defer"`
- [ ] 1.2 Update pi-agent test snapshot to match `modelPolicies` structure with `failureAnalysisModel` and `messageGenerationModel`
- [ ] 1.3 Run `pnpm run test` to verify pi-agent:test passes without snapshot mismatches

## 2. Consolidate Kebab Command Files

- [ ] 2.1 Rename `repo*.ts` files in `pi-agent/src/commands` to `repo-actions.ts`, `repo-check.ts`, `repo-commit.ts`, `repo-run.ts`, and `repo-status.ts`
- [ ] 2.2 Update barrel exports in `pi-agent/src/commands/index.ts` to reference the new consolidated file names
- [ ] 2.3 Run `pnpm run cdk -- repo check kebab-groups` to verify the kebab-groups warning is resolved

## 3. Validate End-to-End Fixes

- [ ] 3.1 Run `pnpm run check` to ensure the cached signal for showcase-public:test is cleared and no diff remains
- [ ] 3.2 Run `pnpm run test` to confirm all 9 tests pass with 0 warnings and 0 errors
- [ ] 3.3 Verify CI pipeline status is green and commit the remediation changes
