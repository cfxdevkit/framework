## Context

See `.ideas/arch-llm-refactor.md` for full analysis. Summary:

```
BEFORE                                    AFTER
──────────────────────────────────────    ──────────────────────────────────────
arch-check      layer: application   →    layer: library
cdk-ai          layer: application   →    REMOVED
cdk-repo-check  layer: application   →    layer: library
llm-tools       spawn → cdk-ai → llm-agents  →  REMOVED (docs-ns calls in-process)
tooling-cli     dynamic import + path detection  →  static import @cfxdevkit/cdk-repo-check
agent-runtime   existsSync(cdk-ai/dist)  →  existsSync(llm-agents/dist + pi-agent/dist)
script contract hardcoded 30+ entries   →  derived from command registry
```

## Goals / Non-Goals

**Goals:**
- 5 packages → 3 in this cluster (remove llm-tools, cdk-ai).
- Zero subprocess spawning for doc enrichment calls.
- `cdk-repo-check` exposes only its contract; accidental arch-check bypass is a compile error.
- Script contracts automatically in sync with CLI command surface.
- Static imports where possible; dynamic loading only where genuinely needed (pi-agent session lifecycle).

**Non-Goals:**
- Changing `arch-check` internal algorithms — no logic changes to checks.
- Moving `arch-check` doc utilities to `docs-pipeline` — deferred to second-pass analysis.
- Changing how `pi-agent` session lifecycle loading works — it must stay dynamic.

## Decisions

### D-P6: Moon layer declarations
`layer: 'library'` for `arch-check`, `cdk-ai` (before archive), `cdk-repo-check`. The moon `layer` field is metadata; no behaviour change.

### D-P4: Explicit re-exports from cdk-repo-check
Replace `export * from '@cfxdevkit/arch-check'` with named exports covering only the symbols confirmed to be used by external consumers (`llm-agents` doc workers, `tooling-cli` checks). Internal `arch-check` types like `Finding`, `Severity`, `DocumentRequirement`, `ScriptRequirement` are NOT re-exported; callers that need them import from `@cfxdevkit/arch-check` directly.

### D-P1: docs-namespace.ts direct routing
`docs-namespace.ts` currently calls `llmToolingNamespace.run([cmd, args])` which spawns tsx → lemonade/cli.ts → loadRepoAgentsModule → cdk-ai → llm-agents. Replace with direct `withLlmAgents((agents) => agents.runXxx(args))` matching the pattern used by every other tooling-cli command. The `llm-tools` package is then unreferenced from `tooling-cli` and can be removed from workspace.

### D-P2: cdk-ai build signal replacement
`agent-runtime.ts` checks `existsSync(cdkAiDistEntry) && existsSync(piAgentDistEntry) && existsSync(llmAgentsDistEntry)`. Remove the `cdkAiDistEntry` check; the remaining two checks (`pi-agent/dist` and `llm-agents/dist`) are sufficient. Update all dynamic import package specifiers from `@cfxdevkit/cdk-ai` to the actual packages.

### D-P3: Static import for cdk-repo-check
`tooling-cli` has `cdk-repo-check:build` as a dependency of `tooling-cli:build`. The dist is always present before `tooling-cli` runs. Replace `loadRepoCheckModule()` + `findRepoRoot` + `pathToFileURL` with a top-level static `import { runRepoCheck, runRepoCommand, defaultRenderer } from '@cfxdevkit/cdk-repo-check'`. The `RepoCheckModule` type shim in `repo-check-runtime.ts` becomes the actual imported types.

### D-P5: Derive script contracts
Add `validateWorkspaceScripts(scriptDefs: ScriptDef[], pkg: PackageJson): Finding[]` to `arch-check`. The `ScriptDef` shape mirrors `ScriptRequirement` but is populated at call time from tooling-cli exports. The hardcoded `workspace-scripts-llm.ts` entries are removed; `arch-check`'s `runDocsCheck` no longer imports them. The `tooling-cli` package exports `getRootScriptRequirements(): ScriptRequirement[]` built from `repoActions`, `agentCommands`, and `repoCommands`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Consumers importing from `cdk-repo-check` via wildcard break when it narrows | Compile error points to the fix; all known consumers already import from cdk-repo-check correctly |
| Removing `llm-tools` breaks a consumer we missed | `grep -r '@cfxdevkit/llm-tools'` in tooling-cli; only docs-namespace.ts and llm-tools own code |
| docs-namespace enrichment behaviour changes | Same `withLlmAgents` pattern used by all other commands; functionally equivalent |
| Static import of cdk-repo-check fails if dist not built | `cdk-repo-check:build` is a dep of `tooling-cli:build`; always available |
