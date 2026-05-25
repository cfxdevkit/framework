## Why

`tooling-cli` declares `@cfxdevkit/pi-agent` and `@cfxdevkit/llm-agents` as `package.json`
dependencies but never imports them via TypeScript module resolution. Instead it hard-codes
filesystem paths at runtime:

```ts
const piAgentDistEntry  = new URL('../../pi-agent/dist/index.js', import.meta.url);
const llmAgentsDistEntry = new URL('../../llm-agents/dist/index.js', import.meta.url);
```

Side effects:
- `LlmConfig` is **redefined locally** in `agent-runtime.ts` (mirrors the canonical type in
  `llm-agents`) because the type cannot be imported through the path-based loader.
- TypeScript cannot see through the runtime `import()` — no autocomplete, no type safety on
  the agent surface.
- The relative paths break silently if the monorepo layout changes.
- `llm-agents` is listed as a direct dep of `tooling-cli` even though `pi-agent` already
  wraps it — creating a redundant dependency hop.

`pi-agent` was unstable at the time this pattern was introduced; the dist is now stable and
published inside the monorepo. The workaround is no longer needed.

## What Changes

- Replace the runtime path resolution in `agent-runtime.ts` with proper static imports from
  `@cfxdevkit/pi-agent`.
- Delete the locally-duplicated `LlmConfig` type in `agent-runtime.ts`; import the canonical
  one from `@cfxdevkit/pi-agent` (or `@cfxdevkit/llm-agents` through pi-agent's re-exports).
- Remove `@cfxdevkit/llm-agents` from `tooling-cli/package.json` — `pi-agent` is the only
  dependency needed on the LLM side.
- Keep `@cfxdevkit/pi-agent` as a direct dep (it is already listed).

## Capabilities

### New Capabilities
- `tooling-cli-typed-agent-surface`: `agent-runtime.ts` exposes a fully typed interface to
  the pi-agent runtime, replacing the untyped dynamic-import façade.

### Modified Capabilities
- `tooling-cli-deps`: dependency on `@cfxdevkit/llm-agents` removed; routing goes through
  `pi-agent` exclusively.

## Impact

- `repos/cfx-tools/infra/tooling-cli/src/agent-runtime.ts` — rewrite runtime loader
- `repos/cfx-tools/infra/tooling-cli/package.json` — remove `@cfxdevkit/llm-agents`
- `repos/cfx-tools/infra/tooling-cli/src/script-requirements.ts` — remove llm-agents source
  path comment if present
- No public API change; `tooling-cli` is a private internal package
