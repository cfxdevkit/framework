# @cfxdevkit/llm-client

Typed provider-agnostic LLM client for Conflux DevKit automation.

## Install

```bash
npm install @cfxdevkit/llm-client
```

## Providers

`resolveProvider()` selects the first usable provider in this order:

1. `artifacts/llm/config/lemonade.json` explicit `baseUrl`
2. `LEMONADE_URL` or `LEMONADE_BASE_URL`
3. Local Lemonade probe (`localhost:13305`, container host aliases, `127.0.0.1:8000`)
4. `OPENAI_BASE_URL` + `OPENAI_API_KEY`
5. `GITHUB_TOKEN` via GitHub Models
6. Throws `LlmProviderNotFoundError` with diagnostics

## Usage

```ts
import { createClient, resolveProvider } from '@cfxdevkit/llm-client';

const provider = await resolveProvider();
const client = createClient(provider);

const response = await client.complete({
  messages: [{ role: 'user', content: 'Hello!' }],
  model: 'gpt-4o',
});

console.log(response.choices[0].message.content);
```

## Exports

```ts
import {
  createClient,
  resolveProvider,
  LemonadeProvider,
  OpenAICompatProvider,
  GitHubModelsProvider,
  type LlmProvider,
} from '@cfxdevkit/llm-client';
```

Provider implementations share the `LlmProvider` interface: `complete()`, `discoverModels()`, and `chooseModel()`.

### Core Functions

| Function | Description |
|----------|-------------|
| `createClient(provider)` | Instantiate a client bound to a provider |
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

<!-- readme-hash: b8e25abd1874699584a5f02420f2f9a827c8a4a3c477f8d350881795df4807ac -->
