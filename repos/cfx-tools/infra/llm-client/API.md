# `@cfxdevkit/llm-client` — Public API

> Typed provider-agnostic LLM client for Conflux DevKit automation.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 43 symbols |

---

## `.`

### Usage

```ts
import { chooseModel, createClient } from '@cfxdevkit/llm-client';

const model = chooseModel('gpt-4o');
const client = createClient(model);
const response = await client.complete('Hello, world!');
```

```ts
// Selects a model from the available models based on name or priority
export { chooseModel }
// Creates a client instance for the chosen model and configuration
export { createClient }
// Default configuration for the LLM client, including provider and model defaults
export { defaultConfig }
// Discovers and lists all available models across configured providers
export { discoverModels }
// Extracts the assistant's text response from an LLM response object
export { extractAssistantText }
// Reads the LLM configuration from the default or specified config file
export { readConfig }
// Writes the current configuration to the config file
export { writeConfig }
// Executes a text completion request using the client
export { complete }
// Executes a completion request using the commit agent (specialized for Git commit messages)
export { completeCommitAgent }
// Executes a structured completion request using the structured agent (e.g., JSON output)
export { completeStructuredAgent }
// Builds the action context used by agents to understand task intent and environment
export { buildActionContext }
// Builds the base context (e.g., working directory, environment info) for LLM operations
export { buildBaseContext }
// Commits a preflight block (e.g., a staged Git commit) using the commit agent
export { commitPreflightBlock }
// Reads the context file from disk (used for persisting or restoring agent state)
export { readContextFile }
// Writes the LLM completion report to disk (e.g., for audit or debugging)
export { writeLlmReport }
// Safely parses a string into a JSON object, throwing on invalid input
export { parseJsonObject }
// Executes a command block (e.g., shell command) as part of an agent workflow
export { commandBlock }
// Executes Git commands via a typed interface
export { git }
// Root directory where all generated artifacts (e.g., reports, context files) are stored
export { artifactsRoot }
// Paths for chat-related files (e.g., conversation history, session logs)
export { chatPaths }
// Path to the default LLM configuration file
export { configPath }
// Default base URLs for each supported LLM provider
export { defaultBaseUrls }
// Paths for model metadata and cache files
export { modelPaths }
// Error thrown when a requested LLM provider is not found or supported
export { LlmProviderNotFoundError }
// Creates a provider instance for a given provider type and configuration
export { createProvider }
// Provider implementation for GitHub Models (e.g., `gpt-4o`, `claude-3.5-sonnet`)
export { GitHubModelsProvider }
// Provider implementation for Lemonade AI models
export { LemonadeProvider }
// Provider implementation for LiteLLM-compatible endpoints
export { LiteLLMProvider }
// Provider implementation for OpenAI-compatible APIs (e.g., v1/chat/completions)
export { OpenAICompatProvider }
// Resolves and returns the base URL for a given provider
export { getProviderBaseUrl }
// Returns the default model name for a given provider
export { getProviderDefaultModel }
// Resolves the actual model to use for a given provider (handles aliases, fallbacks)
export { resolveProviderModel }
// Resolves the provider type from a string or config (e.g., `"github"` → `GitHubModelsProvider`)
export { resolveProvider }
// Represents a chat message with role (e.g., `user`, `assistant`) and content
export { ChatMessage }
// Represents a single attempt to complete a request, including timing and metadata
export { CompletionAttempt }
// Options that control completion behavior (e.g., temperature, max tokens, stream)
export { CompletionOptions }
// Event emitted during streaming or polling completion progress
export { CompletionProgressEvent }
// Report object containing full details of a completion run (attempts, timing, output)
export { CompletionReport }
// Configuration object for the LLM client (provider, model, credentials, etc.)
export { LlmConfig }
// Definition of an LLM model, including name, provider, and capabilities
export { LlmModel }
// Interface defining the contract for an LLM provider (e.g., `complete`, `listModels`)
export { LlmProvider }
// Type union of all supported LLM provider identifiers (`'github' | 'lemonade' | 'litellm' | 'openai-compat'`)
export { LlmProviderType }
// Attempts to resolve a provider instance with fallback logic and error handling
export { resolveProviderAttempt }
```

<!-- api-hash: 1a34350f00eb8f04179a40e68ff21cc4008ae9c731e7b638aa87370ffb33eb89 -->
