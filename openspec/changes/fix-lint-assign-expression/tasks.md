## 1. Investigation & Analysis

- [ ] 1.1 Inspect `src/wiki-validate.ts` at line 135 to identify the assignment inside the expression triggering `noAssignInExpressions`
- [ ] 1.2 Determine the correct refactoring approach to separate the assignment from the expression context

## 2. Implementation

- [ ] 2.1 Extract the assignment to a preceding standalone statement in `src/wiki-validate.ts`
- [ ] 2.2 Update the original expression to reference the assigned variable without inline assignment

## 3. Validation

- [ ] 3.1 Run `pnpm run lint` to verify the `noAssignInExpressions` error is resolved
- [ ] 3.2 Clear lint cache and re-run to confirm stable pass status
- [ ] 3.3 Execute related test suite to ensure no functional regression
