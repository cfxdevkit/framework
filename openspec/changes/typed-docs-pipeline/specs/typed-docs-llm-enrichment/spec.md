## ADDED Requirements

### Requirement: Docs-specific LLM orchestration uses typed pipeline APIs
Docs-oriented local-LLM flows SHALL call typed docs-pipeline APIs for deterministic prep and shared content policies.

#### Scenario: Package-page enrichment reuses typed package sync logic
- **WHEN** `llm:package-pages` runs
- **THEN** the deterministic package sync step is executed through `@cfxdevkit/docs-pipeline`
- **THEN** enrichment workers reuse shared slug, hash, and content helper logic from the same package

#### Scenario: Wiki regeneration reuses a typed wiki adapter
- **WHEN** `llm:wiki` runs
- **THEN** the GitNexus wiki generation bridge and wiki-to-MDX sync are executed through typed docs-pipeline APIs

### Requirement: llm-tools remains a dispatcher, not the docs pipeline owner
The `llm-tools` package SHALL continue exposing docs-related local-LLM commands, but it SHALL dispatch them to typed pipeline-backed flows.

#### Scenario: Local LLM config still comes from llm-client and shared runtime
- **WHEN** a docs enrichment command needs Lemonade configuration or completions
- **THEN** it continues to use `llm-client` and the shared LLM runtime layer
- **THEN** docs-pipeline owns docs orchestration logic above that transport layer

#### Scenario: Docs workers no longer shell out to docs-site implementation scripts
- **WHEN** a TypeScript docs worker performs deterministic preparation
- **THEN** it imports or invokes docs-pipeline APIs/CLI entrypoints
- **THEN** it does not depend on docs-site-local `.mjs` implementation files as its primary integration path