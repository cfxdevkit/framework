# @cfxdevkit/llm-client

Typed provider-agnostic LLM client for Conflux DevKit automation.

## Providers

`resolveProvider()` selects the first usable provider in this order:

1. `artifacts/llm/config/lemonade.json` explicit `baseUrl`
2. `LEMONADE_URL` or `LEMONADE_BASE_URL`
3. Local Lemonade probe (`localhost:13305`, container host aliases, `127.0.0.1:8000`)
4. `OPENAI_BASE_URL` + `OPENAI_API_KEY`
5. `GITHUB_TOKEN` via GitHub Models
6. `LlmProviderNotFoundError` with diagnostics

## Exports

```ts
import {
  createProvider,
  resolveProvider,
  LemonadeProvider,
  OpenAICompatProvider,
  GitHubModelsProvider,
  type LlmProvider,
} from '@cfxdevkit/llm-client';
```

Provider implementations share the `LlmProvider` interface: `complete()`, `discoverModels()`, and `chooseModel()`.
