## ADDED Requirements

### Requirement: Lint error for assignment in expression must be resolved
The system SHALL ensure that no lint errors of type `lint/suspicious/noAssignInExpressions` exist in any source file, specifically in `src/wiki-validate.ts`.

#### Scenario: Lint check passes without assignment-in-expression error
- **WHEN** the `pnpm run lint` command is executed
- **THEN** no error is reported for line 135 in `src/wiki-validate.ts`, and the assignment previously occurring in the expression is refactored into a separate statement

### Requirement: Missing type export 'StatusReport' in pi-agent must be resolved
The system SHALL ensure that all required types are exported from the pi-agent module, specifically the `StatusReport` type.

#### Scenario: Type export check passes for StatusReport
- **WHEN** the pi-agent lint check is executed (e.g., via `pnpm run lint` in the pi-agent directory)
- **THEN** the `StatusReport` type is successfully exported and no missing export error is reported

### Requirement: All lint and check errors must be resolved before OpenSpec artifact generation
The system SHALL ensure that all lint and check errors are resolved prior to generating OpenSpec artifacts, to maintain a clean and correct repository state.

#### Scenario: Precondition for OpenSpec generation is satisfied
- **WHEN** the lint and check pipeline is executed (e.g., via `pnpm run lint` and associated checks)
- **THEN** all errors are resolved (6/9 checks pass, 0 errors), and the pipeline completes successfully without blocking OpenSpec artifact generation
