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
| `configure()` | Configures agent behavior (e.g., model selection, temperature, timeout) |
| `listModels()` | Lists available LLM models for use with agents |
| `parseCommitFlags()` | Parses commit flags (e.g., `--fix`, `--feat`) into structured metadata |

## Provider Pattern

Agents resolve providers through the package-local completion runtime, which reads provider config from `~/.pi/agent/providers.json` (managed by PI) and applies scoped overlays through `CFXDEVKIT_LLM_CONFIG_PATH` when present. CLI callers usually rely on `resolveProvider()` indirectly; tests can still pass mocked provider behavior through the lower-level workflow helpers.

```ts
import { runReviewAgent, runCommit } from '@cfxdevkit/llm-agents';
import { resolveProvider } from './workers/completion/index.ts';

const provider = await resolveProvider();
await runCommit({ provider, cwd: process.cwd() });
```

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | `runAll`, `runReviewAgent`, `configure`, `listActions`, `listModels`, `runAction`, `parseCommitFlags`, `runCommit`, `runPrecommit`, `runDocsUpkeep`, `runTestUpkeep`, `runDocsApi`, `runDocsApiProbe`, `runDocsPackagePages`, `runDocsReadme`, `runStructureUpkeep`, `validateModels`, `runAgentCheck`, `runAgentSmoke`, `RepoActionExecutionResult`, `CommitWorkflowOptions`, `CommitWorkflowResult`, `PrecommitWorkflowResult`, `executeAction`, `getActionDefinitions`, `runCommitWorkflow`, `runPrecommitWorkflow` |

## Usage

```typescript
import { configure, runAction, runAll } from '@cfxdevkit/llm-agents';

// Configure the agent with your preferred model and API settings
configure({ model: 'gpt-4o', apiKey: process.env.OPENAI_API_KEY });

// Run a named repo-aware action through the shared workflow layer
await runAction(['repo-health']);

// Run all agents in sequence
const results = await runAll({ cwd: process.cwd() });
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 1 — platform** — May import Tier 0 framework packages.

<!-- readme-hash: 9c2d6bcf8b0b626edcec2653546c1e382859960dd32fafdab490a94b841e8755 -->
