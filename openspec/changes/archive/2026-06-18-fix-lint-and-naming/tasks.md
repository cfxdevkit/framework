## 1. Fix Lint Errors

- [ ] 1.1 Fix `noAssignInExpressions` error in `llm-agents/src/wiki-validate.ts` by extracting the assignment outside the expression.
- [ ] 1.2 Remove unused `StatusReport` type and resolve formatting diff in `pi-agent`.

## 2. Resolve Kebab-Case Naming Warnings

- [ ] 2.1 Update group names to kebab-case across `tooling-cli`, `arch-check`, `llm-agents`, `pi-agent`, and `cfx-ui`.

## 3. Validate Quality Gates

- [ ] 3.1 Run `pnpm run lint` and `pnpm run check` to verify all errors and warnings are resolved.
- [ ] 3.2 Confirm repo-check passes with 0 errors and 0 warnings.
