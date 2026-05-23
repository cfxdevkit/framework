## ADDED Requirements

### Requirement: Root maintenance commands SHALL be exposed through one namespaced CLI
The system SHALL expose monorepo maintenance commands through a single root dispatcher owned by `@cfxdevkit/tooling-cli`. The root package command surface SHALL route maintenance workflows through this dispatcher instead of adding one direct root alias per package-level workflow.

#### Scenario: Maintainer lists root maintenance commands
- **WHEN** a maintainer runs the root tooling help command from the repository root
- **THEN** the system SHALL show grouped maintenance namespaces and commands from the registered tooling surfaces

#### Scenario: Maintainer executes a namespaced maintenance command
- **WHEN** a maintainer invokes a namespaced root tooling command such as docs, llm, or check
- **THEN** the root dispatcher SHALL route execution to the owning tooling implementation and preserve its exit status

### Requirement: Root compatibility aliases SHALL delegate through the root dispatcher during migration
During the migration window, any retained compatibility script aliases in the root package SHALL delegate through the root dispatcher rather than calling package internals directly.

#### Scenario: Existing root alias is retained temporarily
- **WHEN** a legacy maintenance alias remains available during the migration phase
- **THEN** it SHALL invoke the root dispatcher for execution instead of binding directly to a package CLI or Moon command

#### Scenario: Root maintenance surface is reviewed after migration starts
- **WHEN** the root package scripts are inspected after the new dispatcher lands
- **THEN** the maintenance-related scripts SHALL consist of the root dispatcher entrypoint plus only the explicitly retained compatibility aliases