# `@cfxdevkit/llm-agents` — Public API

> Typed LLM workflow agents for Conflux DevKit repository automation.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 18 symbols |

---

## `.`

```ts
// Runs all registered agents sequentially.
export { runAll }

// Runs the review agent, which analyzes code changes and provides feedback.
export { runReviewAgent }

// Sends a natural-language query to the configured LLM agent and returns a structured response.
export { ask }

// Configures the LLM agent with provided settings (e.g., model, API key, timeout).
export { configure }

// Lists all available actions that can be executed by agents.
export { listActions }

// Lists all supported LLM models for use with agents.
export { listModels }

// Executes a named action using the configured agent.
export { runAction }

// Validates that the configured LLM models are accessible and functional.
export { validateModels }

// Parses commit-related flags (e.g., `--fix`, `--feat`) from command-line arguments.
export { parseCommitFlags }

// Runs the commit agent, which generates and commits changes based on LLM analysis.
export { runCommit }

// Runs the pre-commit agent, which performs checks and transformations before a commit.
export { runPrecommit }

// Runs the API documentation generator agent for codebases.
export { runDocsApi }

// Runs a lightweight probe to verify API documentation generation readiness.
export { runDocsApiProbe }

// Generates or updates package-level documentation pages (e.g., README, usage guides).
export { runDocsPackagePages }

// Runs the README generator/update agent for project documentation.
export { runDocsReadme }

// Runs the upkeep agent responsible for maintaining documentation quality and consistency.
export { runDocsUpkeep }

// Runs the structure upkeep agent, which enforces and updates project structure conventions.
export { runStructureUpkeep }

// Runs the test upkeep agent, which verifies and updates test coverage and quality.
export { runTestUpkeep }
```

### Usage

```ts
import { configure, ask, runAll } from '@cfxdevkit/llm-agents';

// Configure the agent with your preferred model and API settings
configure({ model: 'gpt-4o', apiKey: process.env.OPENAI_API_KEY });

// Ask a question and get a structured response
const response = await ask('What is the current state of the `src/` directory?');

// Run all registered agents
await runAll();
```

<!-- api-hash: ad72b6effeb1349fbf2c1690fc99f4f790154474e3416a48c5b127a0019bbe97 -->
