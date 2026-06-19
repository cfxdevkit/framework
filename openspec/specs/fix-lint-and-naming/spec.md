# fix-lint-and-naming Specification

## Purpose
TBD - created by archiving change fix-lint-and-naming. Update Purpose after archive.
## Requirements
### Requirement: Codebase passes lint and naming conventions
The system SHALL ensure that all lint checks execute without errors and all group/module identifiers adhere to kebab-case naming conventions.

#### Scenario: Resolve assignment-in-expression lint error in llm-agents
- **WHEN** the `llm-agents` package runs lint checks
- **THEN** the `noAssignInExpressions` error at `src/wiki-validate.ts:135` is resolved, ensuring no assignments occur within expressions.

#### Scenario: Remove unused types and fix formatting in pi-agent
- **WHEN** the `pi-agent` package runs lint and format checks
- **THEN** the unused `StatusReport` type is removed, and all formatting diffs are corrected to match the configured style.

#### Scenario: Enforce kebab-case naming across tooling groups
- **WHEN** the codebase is validated for naming conventions across `tooling-cli`, `arch-check`, `llm-agents`, `pi-agent`, and `cfx-ui`
- **THEN** all group and module names conform to kebab-case standards, and zero naming warnings are reported.

