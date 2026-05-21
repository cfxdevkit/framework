## ADDED Requirements

### Requirement: llm:docs-api command exists and is wired
A new `pnpm llm:docs-api` root script calls `@cfxdevkit/llm-tools` dispatch, which routes to a new `docs-api` worker in `@cfxdevkit/llm-agents`.

#### Scenario: Running llm:docs-api
- **WHEN** `pnpm llm:docs-api` is run
- **THEN** the tool first runs `generate:api --write` (deterministic skeleton phase)
- **THEN** for each public package with a freshly written or stale `API.md`, calls the local LLM to enrich descriptions
- **THEN** writes the enriched content back to `API.md`, preserving the `<!-- api-hash: -->` footer

### Requirement: LLM enrichment adds descriptions without modifying skeleton structure
The LLM fills in one-line description comments per export symbol. It does not restructure the sub-paths table, change type signatures, or remove the hash footer.

#### Scenario: LLM enriches export block
- **WHEN** the skeleton has a `function createClient(...)` export with no description
- **THEN** the LLM adds a `// <one-line description>` comment above the declaration
- **THEN** the api-hash footer remains unchanged

#### Scenario: LLM fails or times out
- **WHEN** the local LLM is unavailable or returns invalid JSON
- **THEN** the enrichment step is skipped for that package
- **THEN** the deterministic skeleton (already written) is retained as-is
- **THEN** a warning is logged but the command exits 0

### Requirement: docs-upkeep integrates staleness gate
`llm:docs-upkeep` runs `generate:api --check` as step 0 so the LLM prose pass always starts with fresh API.md files.

#### Scenario: Stale API.md detected during docs-upkeep
- **WHEN** `llm:docs-upkeep` detects stale `API.md` via `generate:api --check`
- **THEN** it runs `generate:api --write` automatically before proceeding to LLM prose pass
