## 1. Fix pi-agent test failures
- [ ] 1.1 Locate and inspect the failing `pi-agent:test` test file to identify the exact assertion mismatch
- [ ] 1.2 Update test fixtures or assertions to include the missing `approvalMode` and `modelPolicies` fields
- [ ] 1.3 Verify `pnpm run test` passes for the pi-agent package without errors

## 2. Resolve kebab-groups naming warnings
- [ ] 2.1 Rename `pi-agent/src/commands/repo*.ts` files to kebab-case equivalents (`repo-actions.ts`, `repo-check.ts`, `repo-commit.ts`, `repo-run.ts`, `repo-status.ts`)
- [ ] 2.2 Update all internal imports and references to reflect the new kebab-case filenames
- [ ] 2.3 Run `pnpm run cdk -- repo check kebab-groups` to confirm the warning is resolved

## 3. Final Validation
- [ ] 3.1 Execute full test suite (`pnpm run test`) to ensure no regressions across packages
- [ ] 3.2 Run `pnpm run cdk -- repo check kebab-groups` to verify zero warnings
- [ ] 3.3 Confirm validation context shows 0 errors and 0 warnings
