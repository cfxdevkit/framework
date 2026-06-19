## ADDED Requirements

### Requirement: Enforce lint compliance in llm-agents
The `llm-agents` package SHALL pass the `lint` quality gate without `noAssignInExpressions` violations. All assignments must be separated from expression contexts to prevent side-effect confusion and ensure static analysis tools can correctly evaluate code purity.

#### Scenario: Refactor assignment in wiki-validate
- **WHEN** the linter analyzes `src/wiki-validate.ts` at line 135
- **THEN** the assignment within the regex match expression MUST be extracted to a standalone statement, ensuring `pnpm run lint` exits with code 0.

### Requirement: Maintain type and format consistency in pi-agent
The `pi-agent` package SHALL maintain strict alignment between interface definitions and their usage across `RunGenerateOptions` and `StatusReport`. Stale format or type mismatches MUST be resolved to prevent compilation and lint failures.

#### Scenario: Resolve stale type mismatch
- **WHEN** the type checker and linter process `pi-agent` source files
- **THEN** the `RunGenerateOptions` and `StatusReport` types MUST match their actual consumption, eliminating all stale format/type mismatch errors.

### Requirement: Pass precommit quality gate
The development pipeline SHALL enforce a passing precommit quality gate with zero lint errors and zero warnings across all affected packages.

#### Scenario: Validate precommit execution
- **WHEN** the precommit hook triggers `pnpm run lint` and associated type checks
- **THEN** the pipeline MUST report a successful status with 0 errors and 0 warnings, unblocking the quality gate.
