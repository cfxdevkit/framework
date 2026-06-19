## 1. Fix Model Policies Configuration

- [ ] 1.1 Locate the pi-agent model policies configuration file
- [ ] 1.2 Add `approvalMode: defer` to the `modelPolicies` object
- [ ] 1.3 Run `pnpm run test` to verify the specific test failure is resolved

## 2. Resolve Kebab-Case Naming Warnings

- [ ] 2.1 Identify all `repo*.ts` files in `pi-agent/src/commands`
- [ ] 2.2 Rename files to kebab-case format
- [ ] 2.3 Update all import statements and references to match new filenames
- [ ] 2.4 Run structural checks to confirm kebab-case warnings are cleared

## 3. Final Validation

- [ ] 3.1 Execute full test suite and confirm all tests pass
- [ ] 3.2 Verify zero warnings and zero errors in validation output
