## 1. Move packages to cfx-tools/infra/

- [ ] 1.1 Create `repos/cfx-tools/infra/` directory (mkdir, not git tracked until content added)
- [ ] 1.2 `git mv repos/cfx-llm/packages/llm-client repos/cfx-tools/infra/llm-client`
- [ ] 1.3 `git mv repos/cfx-llm/packages/llm-agents repos/cfx-tools/infra/llm-agents`
- [ ] 1.4 `git mv repos/cfx-llm/packages/llm-tools repos/cfx-tools/infra/llm-tools`

## 2. Update pnpm-workspace.yaml

- [ ] 2.1 Add `"repos/cfx-tools/infra/*"` glob to `pnpm-workspace.yaml` packages list

## 3. Update .moon/workspace.yml

- [ ] 3.1 Replace `repos/cfx-llm/packages/llm-client` → `repos/cfx-tools/infra/llm-client`
- [ ] 3.2 Replace `repos/cfx-llm/packages/llm-agents` → `repos/cfx-tools/infra/llm-agents`
- [ ] 3.3 Replace `repos/cfx-llm/packages/llm-tools` → `repos/cfx-tools/infra/llm-tools`

## 4. Update arch-rules.yaml

- [ ] 4.1 Remove `"repos/cfx-llm/packages/**"` from the `platform` tier `paths` array in `repos/cfx-meta/arch-rules.yaml`
- [ ] 4.2 Add `"repos/cfx-tools/infra/**"` to the `platform` tier `paths` array

## 5. Clean up cfx-llm repo skeleton

- [ ] 5.1 Remove `repos/cfx-llm/` directory (should be empty of packages after the moves; verify then `git rm -r`)

## 6. Reinstall and verify

- [ ] 6.1 Run `pnpm install` from workspace root to re-link all packages
- [ ] 6.2 Run `pnpm llm:commit --dry-run` to confirm the toolchain still works
- [ ] 6.3 Run `pnpm -w typecheck`
- [ ] 6.4 Run `pnpm -w lint`
- [ ] 6.5 Run `pnpm -w test`
- [ ] 6.6 Rebuild `@cfxdevkit/llm-agents` dist: `pnpm --filter @cfxdevkit/llm-agents build`
