## Context

`@cfxdevkit/llm-tools` currently bundles everything: the Lemonade HTTP client, an experimental Pi integration, config management, the commit/docs/test workflow agents, and the CLI dispatcher — all in a single package and all untyped (`// @ts-nocheck` on 42 files). Any caller wanting programmatic LLM access must take the whole CLI bundle. The provider layer is ad-hoc; adding OpenAI-compatible or GitHub Models fallback would require editing the commit and docs agents directly.

**Repo context**: `repos/cfx-llm/packages/` currently has only `llm-tools`. Two new sibling packages will be added: `llm-client` and `llm-agents`. The existing Vite+TSX+Vitest build stack is reused.

## Goals / Non-Goals

**Goals:**
- Extract the LLM HTTP client + provider abstraction into `@cfxdevkit/llm-client`
- Extract workflow agents (commit, docs-upkeep, test-upkeep, review) into `@cfxdevkit/llm-agents`
- Slim `@cfxdevkit/llm-tools` to a pure CLI dispatcher that composes the two new packages
- Remove all `// @ts-nocheck` suppressors; achieve full TypeScript coverage
- Keep the `llm-tools` public API (`llmCommands`, `LlmCommandDefinition`, `LlmWorker`) unchanged

**Non-Goals:**
- Reimplementing the experimental Pi provider in this change
- Changing CLI command names, flags, or user-visible behaviour
- Publishing `llm-client` or `llm-agents` as public npm packages (both `private: false` but lifecycle = pre-release)

## Decisions

### D1 — Two new packages, not one

**Decision**: Split into `llm-client` (provider layer) + `llm-agents` (workflow layer), rather than a single `llm-core`.

**Rationale**: The client has no knowledge of workflows; the agents have no knowledge of HTTP internals. Keeping them separate means a future consumer can take only the client without the agent orchestration, and the agent tests can mock the provider interface cleanly.

**Alternative considered**: One `llm-core` package. Rejected because it recreates the same bundling problem at a smaller scale.

---

### D2 — `LlmProvider` interface in `llm-client` with four concrete providers

**Decision**: Define an abstract `LlmProvider` interface in `llm-client` that three concrete providers implement: `LemonadeProvider`, `OpenAICompatProvider`, `GitHubModelsProvider`. `llm-agents` programs against the interface only.

**Rationale**: The provider pool is growing (GitHub Models and generic OpenAI-compat endpoints are zero-config for devcontainers and CI). A shared interface keeps agents transport-agnostic.

Interface shape (minimal):
```ts
interface LlmProvider {
  complete(messages: ChatMessage[], opts?: CompletionOptions): Promise<string>;
  discoverModels(): Promise<LlmModel[]>;
  chooseModel(models: LlmModel[], preferred?: string): LlmModel | undefined;
}
```

| Provider | Transport | Trigger |
|---|---|---|
| `LemonadeProvider` | OpenAI-compat HTTP | Config file baseUrl, `LEMONADE_URL`, or local probe |
| `OpenAICompatProvider` | OpenAI-compat HTTP | `OPENAI_BASE_URL` + `OPENAI_API_KEY` |
| `GitHubModelsProvider` | GitHub Models REST | `GITHUB_TOKEN` |

**Removed**: `PiProvider` (`pi.ts`, `pi-rpc.ts`) and `@mariozechner/pi-coding-agent` are deleted. Pi was a proof-of-concept integration and is not in active use; it can be re-added as a proper `LlmProvider` implementation in a future change.

**Alternative considered**: Keep Pi and port it. Rejected: untyped RPC bridge with no tests and no active callers; carrying it forward would block `@ts-nocheck` elimination in the Pi files.

---

### D3 — Workers remain as TypeScript source files (no bundling)

**Decision**: Worker files continue to ship as raw `.ts` source files under `workers/` in the final package tarballs, spawned at runtime via `tsx`. No bundling change.

**Rationale**: Change 3 (arch-check) already established the pattern of shipping `workers/` as source. Bundling workers would require every workflow to be compiled ahead of time and lose the ability to hot-patch in dev.

---

### D4 — `@ts-nocheck` removal strategy: file-by-file, leaf-up

**Decision**: Remove `@ts-nocheck` starting from leaf files (no imports of other `@ts-nocheck` files) and work toward the root. Do not enable strict mode globally until every file in the package is typed.

**Rationale**: A big-bang removal breaks the build immediately. Leaf-up keeps the build green at every step.

**Order for `llm-client`** (approximate): `shared/` → `completion/json.ts`, `completion/client.ts`, `completion/runner.ts` → `completion/context.ts`, `completion/complete.ts` → barrel `completion/index.ts`. `pi.ts` and `pi-rpc.ts` are deleted, not ported.

**Order for `llm-agents`**: `runtime/` stubs → `commit/` → `docs/` → `tests/` → top-level `review.ts`, `all.ts`

---

### D6 — `resolveProvider()` priority chain

**Decision**: Export `resolveProvider(): Promise<LlmProvider>` from `llm-client`. It tries each step in order and returns the first that yields a usable provider. If all fail, it throws with a diagnostic message listing which steps were attempted and why each failed.

**Priority order**:
1. Config file (`artifacts/llm/config/lemonade.json` has `baseUrl` set) → `LemonadeProvider`
2. `LEMONADE_URL` or `LEMONADE_BASE_URL` env var is set → `LemonadeProvider` with that URL
3. Local probe (localhost:13305, 127.0.0.1:13305, host.docker.internal:13305, host.containers.internal:13305, 127.0.0.1:8000) responds with a model list → `LemonadeProvider` (Strix Halo auto-discovery)
4. `OPENAI_BASE_URL` + `OPENAI_API_KEY` are both set → `OpenAICompatProvider`
5. `GITHUB_TOKEN` is set → `GitHubModelsProvider` (zero-config in devcontainers)
6. Throw `LlmProviderNotFoundError` with diagnostics

**Rationale**: Codifies the implicit priority that already exists in `client.ts` (config → env → probe) and extends it with cloud fallbacks. The devcontainer always has `GITHUB_TOKEN`, so step 5 is the guaranteed last resort before failure.

**Alternative considered**: Let callers probe each provider manually. Rejected: every agent would duplicate the same probe logic.

---

### D5 — `llm-tools` keeps `LlmWorker = 'lemonade' | 'deterministic'` temporarily

**Decision**: The `LlmWorker` type in `src/index.ts` is not changed in this change. `'deterministic'` is an artifact of the previous architecture but removing it is a semver bump.

**Rationale**: Out of scope; a follow-up change can clean up the public type.

## Risks / Trade-offs

- **Risk: `repos/cfx-llm/packages/**` not in any arch-rules tier** — Currently `arch-check` only recognises `repos/cfx-tools/packages/**` as platform (T1). `llm-client` and `llm-agents` will be flagged as unknown tier.
  → **Mitigation**: Add `repos/cfx-llm/packages/**` to the `platform` tier paths in `repos/cfx-meta/arch-rules.yaml` as part of this change.

- **Risk: circular dependency during migration** — `llm-tools` and the new packages are siblings in the same pnpm workspace. Using `workspace:*` references is safe but Moon task ordering must be updated.
  → **Mitigation**: Add `llm-client` and `llm-agents` to `.moon/workspace.yml` and `cfx-llm` pnpm workspace before wiring dependencies.

- **Risk: runtime path assumptions in workers** — Several worker files use `import.meta.url` or `process.cwd()` for path resolution. Moving files to a different package changes the worker directory.
  → **Mitigation**: Audit and update all `workerDir` / `artifactsRoot` references during file moves.

- **Risk: `@ts-nocheck` removal surfacing real type errors** — The 42 suppressed files likely have implicit `any` parameters and missing return types that are semantically correct but un-typed.
  → **Mitigation**: Fix types minimally (add explicit parameter types, remove unused params). Do not refactor logic.

## Migration Plan

1. Create `llm-client` package scaffold (package.json, tsconfig, vite.config, moon.yml)
2. Copy `workers/lemonade/completion/` and `workers/lemonade/shared/` into `llm-client/workers/`; add `LlmProvider` interface; remove `@ts-nocheck` in leaf-up order
3. Register `llm-client` in `.moon/workspace.yml` and `cfx-llm` pnpm workspace
4. Create `llm-agents` package scaffold
5. Copy `workers/lemonade/{commit,docs,tests}` and `workers/agents/` into `llm-agents/workers/`; add `llm-client` as dependency; remove `@ts-nocheck` in leaf-up order
6. Register `llm-agents` in `.moon/workspace.yml` and `cfx-llm` pnpm workspace
7. Update `llm-tools` to depend on `llm-client` + `llm-agents`; replace inline `workers/lemonade/` imports with re-exports from the new packages; strip remaining `@ts-nocheck` in `cli.ts` and `llm-agents.ts`
8. Delete moved source files from `llm-tools/workers/`
9. Run full validate: `pnpm run typecheck && pnpm run lint && pnpm exec moon run cfx-llm:build cfx-llm:test`

**Rollback**: All changes are local file moves + new packages. `llm-tools` retains its `workers/` directory until step 8; reverting step 8 restores the original state.

## Open Questions

- Should `llm-client` export a factory function (`createProvider(type)`) or leave provider selection to the caller? (Suggested: factory function, deferred to task author.)
- Should `llm-agents` expose a typed `AgentResult` type for the review agent output, enabling callers to consume review data programmatically? (Nice-to-have; in scope if it doesn't add complexity.)
- For `GitHubModelsProvider`: which default model ID to use? GitHub Models exposes `gpt-4o`, `gpt-4o-mini`, etc. Suggest `gpt-4o-mini` as default; override via config or `GITHUB_MODEL` env var.
