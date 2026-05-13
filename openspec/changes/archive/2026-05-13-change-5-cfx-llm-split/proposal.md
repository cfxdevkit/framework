## Why

`@cfxdevkit/llm-tools` is a single monolithic package where the Lemonade HTTP client, provider wiring, workflow agents (commit, docs-upkeep, test-upkeep), and the CLI all live together — none of it typed. Any caller that needs programmatic LLM access must take on the entire CLI-shaped bundle, and the 42 `// @ts-nocheck` suppressors in `workers/` make the code impossible to statically verify or safely refactor.

## What Changes

- **New package `@cfxdevkit/llm-client`** — Provider-abstracted LLM HTTP client extracted from `workers/lemonade/completion/` and `workers/lemonade/shared/`. Exports a typed `LlmProvider` interface, `createClient()`, `discoverModels()`, `complete()`, `chooseModel()`, and config helpers. Lemonade, OpenAI-compatible, and GitHub Models are concrete implementations of the provider interface.
- **`resolveProvider()` priority chain** — New exported function that selects the appropriate provider at runtime using a 6-step priority: (1) config file `lemonade.json` explicit baseUrl, (2) `LEMONADE_URL` env var, (3) local probe (localhost:13305, Strix Halo auto-discovery), (4) `OPENAI_BASE_URL` + `OPENAI_API_KEY` (generic OpenAI-compat cloud), (5) `GITHUB_TOKEN` → GitHub Models (zero-config in devcontainer), (6) fail with useful diagnostics listing which steps were attempted.
- **New `OpenAICompatProvider`** — Implements `LlmProvider` against any OpenAI-compatible endpoint using `OPENAI_BASE_URL` and `OPENAI_API_KEY`.
- **New `GitHubModelsProvider`** — Implements `LlmProvider` against the GitHub Models API using `GITHUB_TOKEN`; works zero-config in devcontainers.
- **Remove Pi provider** — `workers/lemonade/completion/pi.ts` and `pi-rpc.ts` deleted; `@mariozechner/pi-coding-agent` dep removed. Pi was a test integration; it can be reimplemented as a proper `LlmProvider` in a future change if needed.
- **New package `@cfxdevkit/llm-agents`** — Workflow agent layer extracted from `workers/lemonade/commit/`, `workers/lemonade/docs/`, `workers/lemonade/tests/`, and `workers/agents/`. Depends on `llm-client`. Exports typed agent entry points: `runCommit`, `runDocsUpkeep`, `runTestUpkeep`, `runReviewAgent`.
- **`@cfxdevkit/llm-tools` slimmed** — Keeps the CLI entry point (`workers/lemonade/cli.ts`), the command registry (`src/`), and the `llm-agents.ts` worker shim. Depends on `llm-agents` and `llm-client`. No longer contains any business logic.
- **Eliminate `@ts-nocheck`** — All 42 `// @ts-nocheck` suppressors removed across the three packages; every file fully typed.
- **Provider chain abstraction** — `LlmProvider` interface (`complete`, `discoverModels`, `chooseModel`) defined in `llm-client`; `LemonadeProvider`, `OpenAICompatProvider`, and `GitHubModelsProvider` implement it.

## Capabilities

### New Capabilities

- `llm-client`: Typed, provider-agnostic LLM HTTP client — model discovery, chat completion, config management, Lemonade / OpenAI-compat / GitHub Models provider implementations, and `resolveProvider()` auto-detection chain.
- `llm-agents`: Typed workflow agents for commit, docs-upkeep, test-upkeep, and deterministic code review; depends on `llm-client`.

### Modified Capabilities

<!-- No existing specs to modify — llm-tools has no spec yet. -->

## Impact

- **Code moved**: `repos/cfx-llm/packages/llm-tools/workers/lemonade/{completion,shared}` → `llm-client`; `workers/lemonade/{commit,docs,tests}`, `workers/agents/` → `llm-agents`
- **New packages**: `repos/cfx-llm/packages/llm-client/`, `repos/cfx-llm/packages/llm-agents/`
- **New providers**: `OpenAICompatProvider`, `GitHubModelsProvider` implemented from scratch
- **Removed**: `PiProvider` / `pi.ts` / `pi-rpc.ts` and `@mariozechner/pi-coding-agent` dependency deleted
- **Dependencies updated**: `llm-tools` gains `llm-agents` + `llm-client` as workspace deps; `llm-agents` gains `llm-client`
- **Moon workspace**: `llm-client` and `llm-agents` added to `.moon/workspace.yml` and `cfx-llm` pnpm workspace
- **`arch-rules.yaml` tier update**: `repos/cfx-llm/packages/**` added to the `platform` tier paths so `arch-check` validates both new packages as T1
- **No public API break** for `@cfxdevkit/llm-tools` — CLI behaviour and `llmCommands` export unchanged
