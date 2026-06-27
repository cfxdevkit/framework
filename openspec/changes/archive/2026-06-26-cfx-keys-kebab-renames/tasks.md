## 1. Rename Signer Session Source Files

- [ ] 1.1 Locate `onekey*.ts` files in `repos/cfx-keys/packages/signer-session/src`
- [ ] 1.2 Rename `onekey*.ts` files to `onekey-diagnostics.ts` and `onekey-session.ts`
- [ ] 1.3 Update all import statements and module references within the package to match the new filenames

## 2. Validate Kebab-Case Compliance

- [ ] 2.1 Execute `pnpm run cdk -- repo check kebab-groups` to verify the kebab-groups warning is resolved
- [ ] 2.2 Confirm the validation report shows 0 warnings and the total pass count reflects the fix
