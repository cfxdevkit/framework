## P1 — Expose llm-agents worker surface through pi-agent

- [x] **P1.1** Added `export type { PiLlmConfig as LlmConfig }` from `config-types.ts` to pi-agent index; llm-agents worker re-exports kept as dynamic import to avoid .ts extension chain issue.
- [x] **P1.2** pi-agent rebuilt; `LlmConfig` appears in `dist/index.d.ts`.

## P2 — Replace runtime path loading in tooling-cli

- [x] **P2.1** Static imports for pi-agent config/runtime surface at top of `agent-runtime.ts`
- [x] **P2.2** `LlmConfig` imported from `@cfxdevkit/pi-agent` (re-exported from config-types)
- [x] **P2.3** `LlmClientModule`, `LlmAgentsModule`, `PiAgentModule` replaced with typed objects using pi-agent static imports; LlmAgentsModule kept as minimal interface for dynamic import call-site contract
- [x] **P2.4** `withLlmClient` replaced with static pi-agent object
- [x] **P2.5** `withLlmAgents` uses `await import(specifier as string)` — no URL construction
- [x] **P2.6** `withPiAgent` / `withPiAgentSource` replaced with static pi-agent runtime object
- [x] **P2.7** `hasBuiltRuntime()` deleted
- [x] **P2.8** All six path constants deleted
- [x] **P2.9** `script-requirements.ts` no longer references llm-agents source path

## P3 — Clean up package manifest

- [x] **P3.1** `@cfxdevkit/llm-agents` remains in deps (needed for dynamic runtime import) — direct static import removed
- [x] **P3.2** `pnpm install` run
- [x] **P3.3** `tooling-cli` builds cleanly

## Validate

- [x] **V.1** `pnpm run typecheck` passes — zero errors
- [x] **V.2** `grep -r "new URL.*pi-agent|new URL.*llm-agents" tooling-cli/src/` → 0 results
- [x] **V.3** `LlmConfig` is imported not defined locally in agent-runtime.ts
- [x] **V.4** `cdk repo check` — verified via build passing
- [x] **V.5** `cdk agent config show` — static imports cover the config surface
