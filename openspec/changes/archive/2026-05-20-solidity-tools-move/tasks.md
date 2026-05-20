## 1. Move compiler to cfx-tools/packages/

- [ ] 1.1 `git mv repos/cfx-solidity/packages/compiler repos/cfx-tools/packages/compiler`

## 2. Move codegen-contracts to cfx-tools/packages/

- [ ] 2.1 `git mv repos/cfx-solidity/packages/contracts-extract repos/cfx-tools/packages/codegen-contracts`

## 3. Update .moon/workspace.yml

- [ ] 3.1 Replace `repos/cfx-solidity/packages/compiler` → `repos/cfx-tools/packages/compiler`
- [ ] 3.2 Replace `repos/cfx-solidity/packages/contracts-extract` → `repos/cfx-tools/packages/codegen-contracts`

## 4. Update arch-rules.yaml

- [ ] 4.1 In `repos/cfx-meta/arch-rules.yaml`, replace the single `"repos/cfx-solidity/packages/**"` path in the `framework` tier with two explicit paths: `"repos/cfx-solidity/packages/abis"` and `"repos/cfx-solidity/packages/contracts"`
- [ ] 4.2 Add `"repos/cfx-tools/packages/compiler"` and `"repos/cfx-tools/packages/codegen-contracts"` to the `platform` tier `paths` array

## 5. Clean up cfx-solidity repo references

- [ ] 5.1 Check if `repos/cfx-solidity/package.json` (root) references `packages/compiler` or `packages/contracts-extract` in any workspaces field — remove those references
- [ ] 5.2 Verify `repos/cfx-solidity/` now contains only `packages/abis/` and `packages/contracts/`

## 6. Reinstall and verify

- [ ] 6.1 Run `pnpm install` from workspace root
- [ ] 6.2 Run `pnpm --filter @cfxdevkit/compiler build` to confirm compiler builds in new location
- [ ] 6.3 Run `pnpm --filter @cfxdevkit/devnode-server build` to confirm consumer still resolves `@cfxdevkit/compiler`
- [ ] 6.4 Run `pnpm -w typecheck`
- [ ] 6.5 Run `pnpm check:arch` to confirm no tier violations
