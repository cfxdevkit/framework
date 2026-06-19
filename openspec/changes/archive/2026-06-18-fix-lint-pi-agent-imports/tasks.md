## 1. Reproduce and Analyze Lint Errors

- [ ] 1.1 Run `pnpm run lint` to reproduce the current lint failures in `llm-agents`
- [ ] 1.2 Identify the missing or misplaced `StatusReport` type import in `pi-agent` source files
- [ ] 1.3 Locate the `noAssignInExpressions` violation in `src/wiki-validate.ts` at line 135

## 2. Resolve Import and Formatting Mismatches

- [ ] 2.1 Correct the `StatusReport` type import path and placement in `pi-agent`
- [ ] 2.2 Apply project formatting rules to resolve the formatting diff in `pi-agent` source
- [ ] 2.3 Refactor the assignment expression in `src/wiki-validate.ts` line 135 to comply with `noAssignInExpressions`

## 3. Validate Fixes

- [ ] 3.1 Run `pnpm run lint` to verify all errors and warnings are resolved
- [ ] 3.2 Confirm `StatusReport` is correctly resolved and no type errors remain
- [ ] 3.3 Verify formatting consistency across modified files
