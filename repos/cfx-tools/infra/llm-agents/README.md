# @cfxdevkit/llm-agents

Typed workflow agents for Conflux DevKit repository automation.

## Install

```bash
npm install @cfxdevkit/llm-agents
```

## Agents

| Agent | Description |
|-------|-------------|
| `runCommit()` | Prepares and executes a commit with LLM-assisted message generation and validation |
| `runPrecommit()` | Runs pre-commit checks (linting, formatting, tests) and reports issues |
| `runDocsUpkeep()` | Analyzes docs changes and suggests improvements (e.g., missing examples, outdated references) |
| `runTestUpkeep()` | Suggests test coverage improvements based on changed code paths |
| `runReviewAgent()` | Performs deterministic, file-scoped review of changed files using LLM context |
| `runAction()` | Executes a named LLM-driven action (e.g., `changelog`, `release-notes`) |
| `listActions()` | Lists all registered named actions available in the current environment |
| `runAll()` | Runs all agents sequentially, aggregating results and errors |
| `ask()` | Sends a free-form prompt to the LLM and returns the response |
| `configure()` | Configures agent behavior (e.g., model selection, temperature, timeout) |
| `listModels()` | Lists available LLM models for use with agents |
| `parseCommitFlags()` | Parses commit flags (e.g., `--fix`, `--feat`) into structured metadata |

## Provider Pattern

Agents consume the provider surface from `@cfxdevkit/llm-client`. CLI callers usually rely on `resolveProvider()` indirectly; tests can pass mocked provider behavior through the lower-level workflow helpers.

```ts
import { runReviewAgent, runCommit } from '@cfxdevkit/llm-agents';
import { resolveProvider } from '@cfxdevkit/llm-client';

const provider = await resolveProvider();
await runCommit({ provider, cwd: process.cwd() });
```

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | `runAll`, `runReviewAgent`, `ask`, `configure`, `listActions`, `listModels`, `runAction`, `parseCommitFlags`, `runCommit`, `runPrecommit`, `runDocsApi`, `runDocsUpkeep`, `runTestUpkeep` |

<!-- readme-hash: 584a088e5fd3fbb12aebc9d8ce909f3b17062110569265017b2442e08738e07a -->
