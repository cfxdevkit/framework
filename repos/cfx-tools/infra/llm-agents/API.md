# `@cfxdevkit/llm-agents` — Public API

> Typed LLM workflow agents for Conflux DevKit repository automation.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 33 symbols |

---

## `.`

```ts
// Runs all registered repository actions sequentially.
export { runAll }

// Executes a single agent check action (e.g., linting, formatting, or type-checking).
export { runAgentCheck }

// Runs the code review agent to analyze and suggest improvements for code changes.
export { runReviewAgent }

// Executes a lightweight smoke test to verify agent functionality.
export { runAgentSmoke }

// Represents the result of executing a repository action, including status, logs, and metadata.
export { RepoActionExecutionResult }

// Configures the agent runtime with provided options (e.g., model, timeout, verbosity).
export { configure }

// Executes a single repository action by name, returning its result.
export { executeAction }

// Retrieves the full set of registered action definitions.
export { getActionDefinitions }

// Lists all available action names.
export { listActions }

// Lists all supported LLM model identifiers.
export { listModels }

// Runs a named action directly, with optional parameters.
export { runAction }

// Validates that the configured LLM models are available and usable.
export { validateModels }

// Options for configuring commit workflow execution (e.g., branch, message, auto-merge).
export { CommitWorkflowOptions }

// Result type returned after executing a commit workflow.
export { CommitWorkflowResult }

// Result type returned after executing a precommit workflow.
export { PrecommitWorkflowResult }

// Parses commit-related flags (e.g., `--fix`, `--feat`) from a string or array.
export { parseCommitFlags }

// Runs a commit action (e.g., staging, committing, and pushing changes).
export { runCommit }

// Executes a full commit workflow, including precommit checks and commit message generation.
export { runCommitWorkflow }

// Runs a precommit action (e.g., linting, testing, formatting).
export { runPrecommit }

// Executes a full precommit workflow, including validation and preparation steps.
export { runPrecommitWorkflow }

// Runs the documentation API generator to produce structured API docs.
export { runDocsApi }

// Runs a probe to verify the documentation API endpoint is accessible.
export { runDocsApiProbe }

// Generates package-specific documentation pages (e.g., README, usage examples).
export { runDocsPackagePages }

// Generates or updates the main README file using LLM-based analysis.
export { runDocsReadme }

// Performs structural upkeep tasks (e.g., file reorganization, metadata updates).
export { runStructureUpkeep }

// Generates or updates the project’s wiki pages using LLM-generated content.
export { runWikiGenerate }

// Defines a repository action, including its name, mode, and execution logic.
export { RepoActionDefinition }

// Enum representing the execution mode of a repository action (e.g., `sync`, `async`, `parallel`).
export { RepoActionMode }

// Enum representing the canonical names of supported repository actions.
export { RepoActionName }

// Retrieves a specific repository action definition by name.
export { getRepoAction }

// Lists all registered repository actions with their definitions.
export { listRepoActions }

// A map of all registered repository actions keyed by name.
export { repoActions }

// Runs a named test upkeep action (e.g., unit tests, integration tests, coverage checks).
export { runTestUpkeep }
```

### Usage

```ts
import { configure, runAll } from '@cfxdevkit/llm-agents';

// Configure the agent runtime
configure({
  model: 'gpt-4o',
  timeout: 30_000,
  verbose: true
});

// Run all registered actions
await runAll();
```

<!-- api-hash: d8ab9e93c1b31cb1c4daef449ae940fe02d6453671be0851185f115c35548c29 -->
