# tooling-consolidation Specification

## Purpose

Consolidate the `arch-check`, `cdk-ai`, `cdk-repo-check`, `llm-agents`, and `llm-tools` packages by removing `llm-tools` and `cdk-ai`, narrowing `cdk-repo-check`'s public surface, converting dynamic loading to static imports where safe, and deriving architecture script contracts from the command registry.

## Requirements

### Requirement: `arch-check`, `cdk-repo-check` moon.yml SHALL declare `layer: 'library'`

#### Scenario: Moon layer reflects package role
- **WHEN** `moon task arch-check:build` or `moon task cdk-repo-check:build` is inspected
- **THEN** the project layer SHALL be `library`

---

### Requirement: `cdk-repo-check` SHALL NOT use `export *` from `arch-check`

`cdk-repo-check/src/index.ts` SHALL export only named symbols confirmed needed by external consumers.

#### Scenario: Wildcard bypass is a compile error
- **WHEN** a consumer tries to use an `arch-check`-internal symbol via `@cfxdevkit/cdk-repo-check`
- **THEN** TypeScript SHALL emit a compile error

#### Scenario: All previously-used symbols remain accessible
- **WHEN** `llm-agents` doc workers import from `@cfxdevkit/cdk-repo-check`
- **THEN** `isDocumentationUpkeepPath`, `computeReadmeSkeletonHash`, `renderStructureSkeleton` and related symbols SHALL resolve

---

### Requirement: `docs-namespace.ts` SHALL route enrichment commands in-process

`docs-namespace.ts` SHALL NOT import `@cfxdevkit/llm-tools` or call `llmToolingNamespace.run()`. All doc enrichment commands SHALL use `withLlmAgents(...)` directly.

#### Scenario: docs enrich runs without spawning a subprocess
- **WHEN** `cdk docs enrich api` is run
- **THEN** no `spawn('pnpm', ['exec', 'tsx', ...])` subprocess SHALL be created; the command SHALL execute in-process

---

### Requirement: `llm-tools` SHALL be removed from the moon workspace and archived

#### Scenario: llm-tools no longer in build graph
- **WHEN** `moon run :build` executes
- **THEN** `llm-tools:build` SHALL NOT appear in the task graph

---

### Requirement: `agent-runtime.ts` build signal SHALL NOT reference `cdk-ai`

The `hasBuiltCdkAiRuntime()` check SHALL use `llm-agents/dist/index.js` and `pi-agent/dist/index.js` only.

#### Scenario: cdk-ai dist removed, runtime still detects built state
- **WHEN** `cdk-ai/dist/` does not exist
- **THEN** `hasBuiltCdkAiRuntime()` SHALL return the correct result based on llm-agents and pi-agent dist

---

### Requirement: `cdk-ai` SHALL be removed from the moon workspace and archived

#### Scenario: cdk-ai no longer in build graph
- **WHEN** `moon run :build` executes
- **THEN** `cdk-ai:build` SHALL NOT appear in the task graph

---

### Requirement: `repo-check-runtime.ts` SHALL use static imports

`tooling-cli/src/repo-check-runtime.ts` SHALL import `runRepoCheck`, `runRepoCommand`, and `defaultRenderer` from `@cfxdevkit/cdk-repo-check` at module load time, not via dynamic `import()`.

#### Scenario: cdk repo build resolves without dynamic path detection
- **WHEN** `cdk repo build` is run
- **THEN** `runRepoCommand` SHALL resolve immediately without `findRepoRoot` or `pathToFileURL`

---

### Requirement: Workspace script contracts SHALL be derived from the command registry

`arch-check` SHALL expose `validateWorkspaceScripts(defs, pkg)` taking command definitions. The hardcoded `workspace-scripts-llm.ts` entries SHALL be replaced by entries derived from `tooling-cli`'s exported command definitions.

#### Scenario: New agent command automatically validated
- **WHEN** a new command is added to `agentCommands` in tooling-cli with a corresponding `package.json` script
- **THEN** `arch-check` SHALL validate the script value without any change to arch-check source
