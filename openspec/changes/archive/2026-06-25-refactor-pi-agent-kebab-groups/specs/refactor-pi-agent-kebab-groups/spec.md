## ADDED Requirements

### Requirement: Consolidate repo command files into kebab-case module
The system SHALL consolidate the five `repo*.ts` files located in `pi-agent/src/commands` into a single kebab-case module file. This consolidation MUST satisfy the `kebab-groups` linting rule and preserve all existing command exports and functionality.

#### Scenario: Successful file consolidation
- **WHEN** the five `repo*.ts` files (`repo-actions.ts`, `repo-check.ts`, `repo-commit.ts`, `repo-run.ts`, `repo-status.ts`) are merged into a single kebab-case module
- **THEN** the resulting module file is created in `pi-agent/src/commands` and all original command implementations are preserved

#### Scenario: Linting rule compliance
- **WHEN** the `kebab-groups` linting rule is executed via `pnpm run cdk -- repo check kebab-groups`
- **THEN** the warning for grouped files is resolved and the check passes without errors

#### Scenario: Module export integrity
- **WHEN** the consolidated kebab-case module is imported by other parts of the pi-agent codebase
- **THEN** all original command exports are accessible and function identically to the previous multi-file structure
