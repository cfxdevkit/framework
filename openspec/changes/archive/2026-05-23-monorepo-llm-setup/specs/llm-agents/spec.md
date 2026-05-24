## MODIFIED Requirements

### Requirement: Gate execution SHALL delegate to `@cfxdevkit/cdk-repo-check`

**Status update:** This requirement is satisfied. Additionally:

`llm-agents` doc workers (`discover.ts`, `readme-enrichment.ts`, `readme.ts`, `structure-enrichment.ts`) SHALL import doc-utility symbols from `@cfxdevkit/cdk-repo-check`, not directly from `@cfxdevkit/arch-check`. `@cfxdevkit/arch-check` SHALL be removed from `llm-agents` direct dependencies once no direct imports remain.

#### Scenario: Doc worker imports use cdk-repo-check
- **WHEN** `llm-agents/workers/docs/*.ts` files import arch-check utilities
- **THEN** the import source SHALL be `@cfxdevkit/cdk-repo-check` which re-exports the same symbols

#### Scenario: arch-check not in llm-agents direct dependencies
- **WHEN** `llm-agents/package.json` dependencies are read
- **THEN** `@cfxdevkit/arch-check` SHALL NOT appear as a direct dependency; `@cfxdevkit/cdk-repo-check` SHALL be the single arch-check surface

## ADDED Requirements

### Requirement: `cdk-ai` role SHALL be documented

`packages/cdk-ai/README.md` SHALL document that `cdk-ai` is the dynamic module boundary for `tooling-cli/agent-runtime.ts` — not a general-purpose library. It SHALL state that `cdk-ai/dist/index.js` existence is used as the "built runtime" signal and that callers should import from `@cfxdevkit/llm-agents` or `@cfxdevkit/pi-agent` directly.

#### Scenario: Contributor understands cdk-ai purpose
- **WHEN** a contributor reads `cdk-ai/README.md`
- **THEN** they SHALL understand it is a re-export barrel serving as a dynamic loading boundary, not a code library
