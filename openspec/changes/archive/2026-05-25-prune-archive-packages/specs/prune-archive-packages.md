## ADDED Requirements

### Requirement: no-archive-packages-on-disk
Neither `repos/cfx-tools/packages/archive/` nor `repos/cfx-tools/infra/archive/`
may exist in the working tree.

#### Scenario: directory check
- **WHEN** the repository working tree is inspected
- **THEN** `repos/cfx-tools/packages/archive/` does not exist
- **THEN** `repos/cfx-tools/infra/archive/` does not exist

### Requirement: no-dead-imports
No source file outside the archive directories imports `@cfxdevkit/cdk-ai` or
`@cfxdevkit/llm-tools`.

#### Scenario: import scan
- **WHEN** all `.ts` and `package.json` files outside `*/archive/*` and `*/node_modules/*` are scanned
- **THEN** zero occurrences of `@cfxdevkit/cdk-ai` or `@cfxdevkit/llm-tools` are found
