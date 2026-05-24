# `@cfxdevkit/llm-tools` — Public API

> CLI dispatcher for local LLM automation workflows.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 7 symbols |

---

## `.`

### Usage

```typescript
import { findLlmCommand, llmCommands, LlmCommandDefinition, LlmCommandName, LlmWorker, llmToolingNamespace, runCli } from '@cfxdevkit/llm-tools';

// Example usage of the `findLlmCommand` function
const command = findLlmCommand('chat');
console.log(command); // Output: 'chat'

// Example usage of the `llmCommands` array
const commands = llmCommands;
console.log(commands); // Output: ['chat', 'generate', 'analyze']

// Example usage of the `LlmCommandDefinition` interface
const definition = new LlmCommandDefinition('chat', 'Chat with a model', 'chat');
console.log(definition); // Output: LlmCommandDefinition { name: 'chat', description: 'Chat with a model', usage: 'chat' }

// Example usage of the `LlmCommandName` enum
const name = LlmCommandName.chat;
console.log(name); // Output: chat

// Example usage of the `LlmWorker` class
const worker = new LlmWorker();
console.log(worker); // Output: LlmWorker { name: 'chat', description: 'Chat with a model', usage: 'chat' }

// Example usage of the `llmToolingNamespace` namespace
const namespace = llmToolingNamespace;
console.log(namespace); // Output: llmToolingNamespace { name: 'chat', description: 'Chat with a model', usage: 'chat' }

// Example usage of the `runCli` function
runCli();
```

```ts
// Locates a specific LLM command by its identifier.
// Returns the command name if found, otherwise `undefined`.
export { findLlmCommand }

// A collection of all available LLM command names.
// Contains the identifiers for supported LLM operations.
export { llmCommands }

// Defines the structure and metadata for an LLM command.
// Used to register or describe LLM commands with name, description, and usage.
export { LlmCommandDefinition }

// Enumeration of valid LLM command identifiers.
// Provides type-safe access to supported command names.
export { LlmCommandName }

// Orchestrates the execution of LLM-based tasks.
// Wraps command metadata and provides execution logic for LLM workflows.
export { LlmWorker }

// Provides a grouped namespace for LLM tooling utilities.
// Exposes shared utilities and configuration for LLM automation.
export { llmToolingNamespace }

// Starts the command-line interface for LLM automation.
// Parses CLI arguments and dispatches to the appropriate LLM command handler.
export { runCli }
```

<!-- api-hash: 6a5e76c85ef4c238b6f7fe948b4eda391e86b59a0467c5fcffa848bc32f7b1c4 -->
