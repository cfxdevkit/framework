## 1. Fix llm-agents lint violation

- [ ] 1.1 Locate the `noAssignInExpressions` violation at `src/wiki-validate.ts:135:11`
- [ ] 1.2 Refactor the assignment-in-expression to a separate statement or explicit conditional check
- [ ] 1.3 Run `pnpm run lint` in `llm-agents` to confirm the error is resolved

## 2. Fix pi-agent lint violation

- [ ] 2.1 Identify the source of the import/export mismatch in the `pi-agent` package
- [ ] 2.2 Correct the import/export declarations to align with the actual module structure and exports
- [ ] 2.3 Run `pnpm run lint` in `pi-agent` to confirm the error is resolved

## 3. Validate precommit pipeline

- [ ] 3.1 Execute the full precommit pipeline to ensure both packages pass linting without regressions
- [ ] 3.2 Verify `repo-check` validation completes with 0 errors and 0 warnings
- [ ] 3.3 Commit the lint fixes and push to trigger CI validation
