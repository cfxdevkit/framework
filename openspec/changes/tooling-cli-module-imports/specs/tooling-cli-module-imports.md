## ADDED Requirements

### Requirement: static-agent-imports
`tooling-cli` must import `@cfxdevkit/pi-agent` as a static ES module dependency.
No runtime path construction (`new URL(...)`) or dynamic `import(string)` calls are
permitted for agent-surface modules.

#### Scenario: TypeScript build
- **WHEN** `tsc --noEmit` runs on `tooling-cli`
- **THEN** all types from `@cfxdevkit/pi-agent` resolve without errors; no `any` casts
  on the agent surface

#### Scenario: Vite bundle
- **WHEN** `tooling-cli` is built with Vite
- **THEN** `pi-agent` code is inlined into the dist; no external `../../pi-agent/dist/`
  path references remain in the bundle

### Requirement: no-duplicate-llm-config-type
The `LlmConfig` type must not be defined in `tooling-cli` source. It must be imported
from `@cfxdevkit/pi-agent` or `@cfxdevkit/llm-agents` (via pi-agent's re-exports).

#### Scenario: type uniqueness
- **WHEN** `agent-runtime.ts` is inspected
- **THEN** there is no local `type LlmConfig` or `interface LlmConfig` declaration

### Requirement: single-llm-dep
`tooling-cli/package.json` must list exactly one LLM-side workspace dependency:
`@cfxdevkit/pi-agent`. `@cfxdevkit/llm-agents` must not appear in `dependencies` or
`devDependencies`.

#### Scenario: package manifest
- **WHEN** `tooling-cli/package.json` is read
- **THEN** `@cfxdevkit/llm-agents` does not appear in any dependency field
