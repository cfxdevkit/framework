## ADDED Requirements

### Requirement: `llm-agents` SHALL expose machine-readable repo action definitions
`llm-agents` SHALL expose repo action definitions with enough metadata for external runtimes to register commands and tools without scraping human help text.

#### Scenario: Runtime enumerates action definitions
- **WHEN** the PI runtime requests repo action definitions from `llm-agents`
- **THEN** it SHALL receive structured definitions that include action identity, titles, descriptions, workflow mode, and context metadata

### Requirement: `llm-agents` SHALL provide structured workflow execution payloads for runtime consumers
`llm-agents` SHALL provide structured execution payloads for workflows that need richer runtime rendering than plain text output.

#### Scenario: Precommit exposes structured reports
- **WHEN** a runtime executes the precommit workflow through `llm-agents`
- **THEN** `llm-agents` SHALL return structured execution context, gate report, and failure-analysis data alongside human-readable output

#### Scenario: Review exposes structured findings
- **WHEN** a runtime executes the review workflow through `llm-agents`
- **THEN** `llm-agents` SHALL return structured findings or execution metadata suitable for direct runtime rendering