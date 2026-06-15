# `@cfxdevkit/llm-agents` — Public API

> Typed LLM workflow agents for Conflux DevKit repository automation.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 35 symbols |

---

## `.`

```ts
// Runs all registered agents sequentially.
export { runAll }

// Executes a single agent check (e.g., linting, formatting, or validation).
export { runAgentCheck }

// Runs the review agent, typically used for code review automation.
export { runReviewAgent }

// Runs a lightweight smoke test for agent functionality.
export { runAgentSmoke }

// Represents the result of executing a repository action.
export { RepoActionExecutionResult }

// Configures the agent runtime with provided options.
export { configure }

// Executes a single action definition programmatically.
export { executeAction }

// Retrieves all registered action definitions.
export { getActionDefinitions }

// Lists all available actions by name.
export { listActions }

// Lists all supported LLM models for agent execution.
export { listModels }

// Runs a specific action by name or definition.
export { runAction }

// Validates that configured models are supported and available.
export { validateModels }

// Options for configuring commit workflow execution.
export { CommitWorkflowOptions }

// Result type returned after executing a commit workflow.
export { CommitWorkflowResult }

// Result type returned after executing a precommit workflow.
export { PrecommitWorkflowResult }

// Parses commit-related flags from command-line arguments or config.
export { parseCommitFlags }

// Runs a commit action (e.g., generating commit message or applying changes).
export { runCommit }

// Runs a full commit workflow (precommit → commit → postcommit).
export { runCommitWorkflow }

// Runs a precommit action (e.g., linting, testing, formatting).
export { runPrecommit }

// Runs a full precommit workflow (e.g., checks before commit).
export { runPrecommitWorkflow }

// Configuration object for defining an action's behavior.
export { ActionConfig }

// Resolves an action configuration, merging defaults and overrides.
export { resolveActionConfig }

// Runs the documentation API generator (e.g., for API reference docs).
export { runDocsApi }

// Probes the documentation API endpoint for health or availability.
export { runDocsApiProbe }

// Generates package-level documentation pages.
export { runDocsPackagePages }

// Generates or updates README content.
export { runDocsReadme }

// Performs structural upkeep tasks (e.g., file layout, metadata updates).
export { runStructureUpkeep }

// Generates or updates wiki content (e.g., documentation pages).
export { runWikiGenerate }

// Defines a repository action with metadata and execution logic.
export { RepoActionDefinition }

// Enum representing the mode in which an action runs (e.g., `manual`, `auto`, `ci`).
export { RepoActionMode }

// Type alias for known repository action names (e.g., `"docs/readme"`, `"test/upkeep"`).
export { RepoActionName }

// Retrieves a specific repository action by name.
export { getRepoAction }

// Lists all registered repository actions.
export { listRepoActions }

// A registry of all built-in repository actions.
export { repoActions }

// Runs a specific repository action by name or definition.
export { runTestUpkeep }
```

<!-- api-hash: c4d5fa681d647cf9f353ecff27ee8dc545d94a74e7b2c5448ac2c033c641dea6 -->
