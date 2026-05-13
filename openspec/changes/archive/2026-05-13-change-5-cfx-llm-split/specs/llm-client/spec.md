## ADDED Requirements

### Requirement: Provider interface
`llm-client` SHALL export an `LlmProvider` interface with methods `complete`, `discoverModels`, and `chooseModel`. All workflow consumers SHALL program against this interface only.

#### Scenario: Interface is imported by llm-agents
- **WHEN** `llm-agents` imports from `@cfxdevkit/llm-client`
- **THEN** it receives only the `LlmProvider` interface and supporting types — no Lemonade-specific internals

---

### Requirement: Lemonade provider
`llm-client` SHALL export a `LemonadeProvider` class implementing `LlmProvider` that discovers models by probing standard Lemonade base URLs (`localhost:13305`, `127.0.0.1:13305`, `host.docker.internal:13305`, `host.containers.internal:13305`, `127.0.0.1:8000`) and completes chat via OpenAI-compatible `/chat/completions`.

#### Scenario: Model discovery succeeds
- **WHEN** at least one Lemonade base URL responds to `/api/v1/models` or `/v1/models` with a non-empty model list
- **THEN** `discoverModels()` SHALL return that model list with id, labels, size, and suggested fields

#### Scenario: Model discovery fails
- **WHEN** all probe URLs time out or return errors
- **THEN** `discoverModels()` SHALL return an empty array without throwing

#### Scenario: Chat completion
- **WHEN** `complete(messages, opts)` is called with a valid message array
- **THEN** `LemonadeProvider` SHALL POST to `/api/v1/chat/completions` and return the assistant message content as a string

---

### Requirement: Provider factory
`llm-client` SHALL export a `createProvider(type: 'lemonade' | 'openai-compat' | 'github-models', config?)` factory that returns the appropriate `LlmProvider` implementation.

#### Scenario: Factory creates Lemonade provider
- **WHEN** `createProvider('lemonade')` is called
- **THEN** a `LemonadeProvider` instance is returned

#### Scenario: Factory creates OpenAI-compat provider
- **WHEN** `createProvider('openai-compat', { baseUrl, apiKey })` is called
- **THEN** an `OpenAICompatProvider` instance is returned

#### Scenario: Factory creates GitHub Models provider
- **WHEN** `createProvider('github-models', { token })` is called
- **THEN** a `GitHubModelsProvider` instance is returned

---

### Requirement: resolveProvider priority chain
`llm-client` SHALL export `resolveProvider(): Promise<LlmProvider>` that selects a provider using a six-step priority chain, returning the first that succeeds:
1. Config file (`artifacts/llm/config/lemonade.json`) has `baseUrl` set → `LemonadeProvider`
2. `LEMONADE_URL` or `LEMONADE_BASE_URL` env var is set → `LemonadeProvider` with that URL
3. Local probe (default Lemonade ports) responds with a non-empty model list → `LemonadeProvider`
4. `OPENAI_BASE_URL` and `OPENAI_API_KEY` are both set → `OpenAICompatProvider`
5. `GITHUB_TOKEN` is set → `GitHubModelsProvider`
6. Throw `LlmProviderNotFoundError` with diagnostics

#### Scenario: Config file wins over env var
- **WHEN** `lemonade.json` has `baseUrl` set AND `LEMONADE_URL` is also set
- **THEN** `resolveProvider()` returns a `LemonadeProvider` using the config file baseUrl

#### Scenario: LEMONADE_URL wins over local probe
- **WHEN** `lemonade.json` has no `baseUrl`, `LEMONADE_URL` is set, and local probe would also succeed
- **THEN** `resolveProvider()` returns a `LemonadeProvider` using `LEMONADE_URL`

#### Scenario: Falls back to GitHub Models in devcontainer
- **WHEN** no Lemonade source is available, `OPENAI_BASE_URL` is not set, but `GITHUB_TOKEN` is set
- **THEN** `resolveProvider()` returns a `GitHubModelsProvider`

#### Scenario: Diagnostics on total failure
- **WHEN** all six steps fail
- **THEN** `resolveProvider()` SHALL throw `LlmProviderNotFoundError` with a message listing which steps were attempted and why each failed

---

### Requirement: OpenAI-compatible provider
`llm-client` SHALL export an `OpenAICompatProvider` class implementing `LlmProvider` that sends chat completions to any OpenAI-compatible endpoint using `OPENAI_BASE_URL` and `OPENAI_API_KEY`.

#### Scenario: Completion with env-provided credentials
- **WHEN** `OPENAI_BASE_URL` and `OPENAI_API_KEY` are set and `OpenAICompatProvider.complete(messages)` is called
- **THEN** a POST is made to `${OPENAI_BASE_URL}/chat/completions` with `Authorization: Bearer ${OPENAI_API_KEY}` and the assistant content is returned

#### Scenario: Model discovery returns empty for OpenAI-compat
- **WHEN** `OpenAICompatProvider.discoverModels()` is called
- **THEN** it returns an empty array without throwing (OpenAI-compat endpoints do not require model discovery)

---

### Requirement: GitHub Models provider
`llm-client` SHALL export a `GitHubModelsProvider` class implementing `LlmProvider` that sends completions to the GitHub Models inference endpoint (`https://models.inference.ai.azure.com`) using `GITHUB_TOKEN` as a bearer token.

#### Scenario: Completion via GitHub Models
- **WHEN** `GITHUB_TOKEN` is set and `GitHubModelsProvider.complete(messages)` is called
- **THEN** a POST is made to the GitHub Models endpoint with `Authorization: Bearer ${GITHUB_TOKEN}` and the assistant content is returned

#### Scenario: Default model selection
- **WHEN** no model is specified and `GitHubModelsProvider.complete(messages)` is called
- **THEN** the model defaults to `gpt-4o-mini` unless overridden by `GITHUB_MODEL` env var or config

#### Scenario: Model discovery returns catalogue
- **WHEN** `GitHubModelsProvider.discoverModels()` is called
- **THEN** it returns the list of models from the GitHub Models catalogue endpoint

---

### Requirement: Config management
`llm-client` SHALL export `readConfig()` and `writeConfig(config)` that read and write the Lemonade config file at `artifacts/llm/config/lemonade.json`. `defaultConfig()` SHALL return the default config object.

#### Scenario: Read config when file exists
- **WHEN** `artifacts/llm/config/lemonade.json` exists and is valid JSON
- **THEN** `readConfig()` SHALL return the parsed config object

#### Scenario: Read config when file is absent
- **WHEN** `artifacts/llm/config/lemonade.json` does not exist
- **THEN** `readConfig()` SHALL return the result of `defaultConfig()` without throwing

---

### Requirement: Model selection
`llm-client` SHALL export `chooseModel(models, preferredId?)` that returns the best available model: the preferred model by ID if present, then the first `suggested` model, then the first model overall.

#### Scenario: Preferred model present
- **WHEN** `chooseModel(models, 'my-model')` is called and a model with id `'my-model'` exists in the list
- **THEN** that model is returned

#### Scenario: No preferred model, suggested present
- **WHEN** no preferred model matches but at least one model has `suggested: true`
- **THEN** the first suggested model is returned

---

### Requirement: No @ts-nocheck in llm-client
All TypeScript source files in `@cfxdevkit/llm-client` SHALL have no `// @ts-nocheck` suppressors. All exported symbols SHALL have explicit type annotations.

#### Scenario: Typecheck passes without suppressors
- **WHEN** `tsc --noEmit` is run on `llm-client`
- **THEN** it exits 0 with no errors
