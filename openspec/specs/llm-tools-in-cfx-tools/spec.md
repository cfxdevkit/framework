# llm-tools-in-cfx-tools Specification

## Purpose
TBD - created by archiving change cfx-llm-merge. Update Purpose after archive.
## Requirements
### Requirement: LLM automation packages SHALL reside under repos/cfx-tools/infra/
`@cfxdevkit/llm-agents` and `@cfxdevkit/llm-tools` SHALL have their source directories under `repos/cfx-tools/infra/` and SHALL NOT exist under `repos/cfx-llm/`.

#### Scenario: Package paths resolve under cfx-tools/infra
- **WHEN** `pnpm ls --json` is run from the workspace root
- **THEN** `@cfxdevkit/llm-agents` and `@cfxdevkit/llm-tools` SHALL each report a path under `repos/cfx-tools/infra/`

#### Scenario: repos/cfx-llm directory is removed
- **WHEN** the workspace root is listed
- **THEN** `repos/cfx-llm/` SHALL NOT exist

### Requirement: LLM package names and APIs SHALL be unchanged after the move
The npm package names, exported symbols, and `workspace:*` dependency references SHALL remain identical.

#### Scenario: pnpm llm:commit continues to work after the move
- **WHEN** `pnpm llm:commit --dry-run` is run from the workspace root
- **THEN** it SHALL complete without errors (exit code 0 or dry-run exit)

