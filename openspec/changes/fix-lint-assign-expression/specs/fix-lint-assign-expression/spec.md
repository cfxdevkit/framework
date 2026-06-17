## ADDED Requirements

### Requirement: Lint rule compliance for wiki-validate
The system SHALL ensure that `src/wiki-validate.ts` adheres to the `noAssignInExpressions` lint rule by refactoring assignments used within expressions into standalone statements or valid expression patterns.

#### Scenario: Resolve noAssignInExpressions error
- **WHEN** the linting pipeline executes `pnpm run lint` on the `llm-agents` package
- **THEN** the `noAssignInExpressions` error at `src/wiki-validate.ts:135:11` is resolved and the validation passes without errors.
