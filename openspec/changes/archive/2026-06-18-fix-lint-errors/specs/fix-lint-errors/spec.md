## ADDED Requirements

### Requirement: Lint violations in llm-agents and pi-agent must be resolved
The system SHALL eliminate hard lint failures in `llm-agents` and `pi-agent` that currently block the precommit pipeline and `repo-check` validation.

#### Scenario: Resolve noAssignInExpressions in wiki-validate.ts
- **WHEN** the `llm-agents:lint` pipeline executes on `src/wiki-validate.ts`
- **THEN** the assignment within the expression at line 135 SHALL be refactored into a standalone statement, satisfying the `lint/suspicious/noAssignInExpressions` rule.

#### Scenario: Resolve import/export mismatch in pi-agent
- **WHEN** the `pi-agent:lint` pipeline executes
- **THEN** all import and export declarations SHALL be corrected to match their actual definitions, satisfying the import/export mismatch rule.

#### Scenario: Precommit pipeline passes lint checks
- **WHEN** the precommit hook runs `pnpm run lint`
- **THEN** the validation context SHALL report 0 errors and 0 warnings for the previously failing rules, allowing the pipeline to pass.
