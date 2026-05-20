# @cfxdevkit/llm-agents

Typed workflow agents for Conflux DevKit repository automation.

## Agents

- `runCommit()` and `runPrecommit()` for commit preparation and quality gates
- `runDocsUpkeep()` for documentation maintenance recommendations
- `runTestUpkeep()` for test coverage recommendations
- `runReviewAgent()` for deterministic changed-file review
- `runAction()` and `listActions()` for named repository LLM actions

## Provider Pattern

Agents consume the provider surface from `@cfxdevkit/llm-client`. CLI callers usually rely on `resolveProvider()` indirectly; tests can pass mocked provider behavior through the lower-level workflow helpers.

```ts
import { runReviewAgent, runCommit } from '@cfxdevkit/llm-agents';
```
