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
| `.` | `runAll`, `runReviewAgent`, `ask`, `configure`, `listActions`, `listModels`, `runAction`, `parseCommitFlags`, `runCommit`, `runPrecommit`, `runDocsApi`, `runDocsUpkeep`, `runTestUpkeep`, `runDocsApiProbe`, `runDocsPackagePages`, `runDocsReadme`, `runStructureUpkeep`, `validateModels` |

## Usage

```typescript
import { configure, ask, runAll } from '@cfxdevkit/llm-agents';

// Configure the agent with your preferred model and API settings
configure({ model: 'gpt-4o', apiKey: process.env.OPENAI_API_KEY });

// Ask a question and get a structured response
const response = await ask('What is the current state of the `src/` directory?');

// Run all agents in sequence
const results = await runAll({ cwd: process.cwd() });
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 1 — platform** — May import Tier 0 framework packages.

<!-- readme-hash: 584a088e5fd3fbb12aebc9d8ce909f3b17062110569265017b2442e08738e07a -->
