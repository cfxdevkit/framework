# @cfxdevkit/llm-client

Typed provider-agnostic LLM client for Conflux DevKit automation.

## Install

```bash
npm install @cfxdevkit/llm-client
```

## Providers

`resolveProvider()` selects the first usable provider in this order:

1. `artifacts/llm/config/llm.json` explicit `provider` + `baseUrl`  
   If `provider` is omitted but `baseUrl` is present, the config is treated as `litellm`.
2. `LITELLM_BASE_URL`
3. `LEMONADE_URL` or `LEMONADE_BASE_URL`
4. Local provider probe (`localhost:13305`, container host aliases, `127.0.0.1:8000`)
5. `OPENAI_BASE_URL` + `OPENAI_API_KEY`
6. `GITHUB_TOKEN` via GitHub Models
7. Throws `LlmProviderNotFoundError` with diagnostics

## Usage

```ts
import { resolveProvider } from '@cfxdevkit/llm-client';

const provider = await resolveProvider();
const text = await provider.complete([{ role: 'user', content: 'Hello!' }], {
  model: 'gpt-4o',
});

console.log(text);
```

## Exports

```ts
import {
  resolveProvider,
  LemonadeProvider,
  LiteLLMProvider,
  OpenAICompatProvider,
  GitHubModelsProvider,
  type LlmProvider,
} from '@cfxdevkit/llm-client';
```

Provider implementations share the `LlmProvider` interface: `complete()`, `discoverModels()`, and `chooseModel()`.

The preferred local config path is `artifacts/llm/config/llm.json`. Reads still fall back to `artifacts/llm/config/lemonade.json` for compatibility, and the config remains provider-aware so it can point at LiteLLM, Lemonade, OpenAI-compatible backends, or GitHub Models.

### Core Functions

| Function | Description |
|----------|-------------|
| `resolveProvider()` | Auto-select provider using environment/config |
| `complete(options)` | Send a chat completion request |
| `discoverModels()` | List available models from the provider |
| `chooseModel(pattern?)` | Select a model matching optional regex pattern |

### Agent Helpers

| Function | Description |
|----------|-------------|
| `completeCommitAgent(context)` | Run commit message generation agent |
| `completeStructuredAgent(schema, context)` | Run structured output agent |
| `buildBaseContext()` | Build standard context for agents |
| `buildActionContext(action)` | Build action-specific context |

### Utilities

| Function | Description |
|----------|-------------|
| `extractAssistantText(response)` | Extract assistant message content |
| `parseJsonObject(text)` | Safely parse JSON from LLM output |
| `readConfig(path?)` | Load LLM config from file |
| `writeConfig(config, path?)` | Save LLM config to file |
| `readContextFile(path)` | Load context JSON from file |
| `writeLlmReport(report, path)` | Write completion report to file |

### Constants & Paths

| Export | Description |
|--------|-------------|
| `defaultBaseUrls` | Default base URLs for known providers |
| `artifactsRoot` | Default artifacts directory root |
| `configPath` | Default config file path |
| `chatPaths` | Default chat log paths |
| `modelPaths` | Default model cache paths |

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 38 symbols |

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 1 — platform** — May import Tier 0 framework packages.

<!-- readme-hash: b8e25abd1874699584a5f02420f2f9a827c8a4a3c477f8d350881795df4807ac -->
