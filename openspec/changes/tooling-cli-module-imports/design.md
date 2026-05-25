## Context

`tooling-cli` is the `cdk` CLI entry point (`@cfxdevkit/tooling-cli`). It wires together
repo-check, docs, and agent (LLM) commands. The agent surface (`agent-namespace.ts`,
`agent-runtime.ts`) shells out to pi-agent and llm-agents for commit workflows, smoke tests,
and config management.

Currently `agent-runtime.ts` resolves those packages by constructing `new URL` paths to their
`dist/index.js` files and calling `import(url.href)` at runtime. This bypasses the TypeScript
module graph entirely.

## Goals / Non-Goals

**Goals:**
- Import `@cfxdevkit/pi-agent` as a normal ES module in `agent-runtime.ts`
- Delete the locally-duplicated `LlmConfig` type; use the exported type from `pi-agent`
- Remove `@cfxdevkit/llm-agents` from `tooling-cli`'s `package.json`
- TypeScript resolves all agent-surface types at compile time (no `import(string)` casts)

**Non-Goals:**
- Changing the public CLI surface or command behaviour
- Restructuring `pi-agent` or `llm-agents` exports
- Touching any file outside `tooling-cli`

## Decisions

**Import pi-agent directly.** `pi-agent` already re-exports everything `tooling-cli` needs
from `llm-agents` (config types, runtime entry points). A single direct dep is cleaner than
two parallel deps pointing at the same logical boundary.

**Remove the `hasBuiltRuntime()` guard.** That function exists to handle the case where dist
files may not exist (pre-build dev mode). With a proper module import, the module bundler
(Vite) inlines the dependency; the guard becomes unnecessary.

**Keep `script-requirements.ts` comments updated** to reflect that llm-agents is accessed
through pi-agent, not directly.

## Risks / Trade-offs

- If `pi-agent` doesn't re-export a type that `agent-runtime.ts` currently reads from the
  dynamic import, that type must be added to pi-agent's public exports first.
- Vite bundles the pi-agent code into the tooling-cli dist — this slightly increases bundle
  size but eliminates the runtime dependency on co-located dist files.
