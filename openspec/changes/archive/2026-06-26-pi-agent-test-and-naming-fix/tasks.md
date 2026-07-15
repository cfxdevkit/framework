## 1. Fix pi-agent Test Snapshot Mismatch

- [ ] 1.1 Update pi-agent test snapshot to include the `approvalMode: "defer"` field in the expected output
- [ ] 1.2 Run `pnpm run test` to verify the snapshot mismatch error is resolved

## 2. Resolve Kebab-Case Naming Warning

- [ ] 2.1 Rename `repo*.ts` files in `pi-agent/src/commands` to strict kebab-case (`repo-actions.ts`, `repo-check.ts`, `repo-commit.ts`, `repo-run.ts`, `repo-status.ts`)
- [ ] 2.2 Update all internal imports and module references to match the new kebab-case filenames
- [ ] 2.3 Run `pnpm run cdk -- repo check kebab-groups` to confirm the naming warning is cleared

## 3. Final Validation

- [ ] 3.1 Execute full test suite to ensure no regressions in dependent packages
- [ ] 3.2 Verify validation context reports 0 errors and 0 warnings for the pi-agent capability
