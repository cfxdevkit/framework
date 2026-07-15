## 1. Fix llm-agents noAssignInExpressions

- [ ] 1.1 Locate the assignment expression at src/wiki-validate.ts:135 and analyze why it triggers lint/suspicious/noAssignInExpressions
- [ ] 1.2 Refactor the code to extract the assignment into a separate statement or use a side-effect-free pattern
- [ ] 1.3 Run pnpm run lint in the llm-agents directory to confirm the error is resolved

## 2. Fix pi-agent stale format/type mismatch

- [ ] 2.1 Identify the exact type/interface mismatch in RunGenerateOptions and StatusReport causing the lint error
- [ ] 2.2 Update the type definitions or code formatting to align with current lint and format rules
- [ ] 2.3 Run pnpm run lint in the pi-agent directory to confirm the error is resolved

## 3. Validate precommit quality gate

- [ ] 3.1 Execute the full precommit/lint pipeline across all affected packages
- [ ] 3.2 Verify that total lint errors drop to 0 and the quality gate status changes from error to passed
