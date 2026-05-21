# `@cfxdevkit/llm-tools` — Public API

> CLI dispatcher for local LLM automation workflows.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 5 symbols |

---

## `.`

```ts
export type LlmWorker = 'lemonade' | 'deterministic';
export type LlmCommandName = (typeof llmCommands)[number]['name'];
export interface LlmCommandDefinition {
export declare const llmCommands: readonly [
export declare function findLlmCommand(name: string): LlmCommandDefinition | undefined;
```

<!-- api-hash: a3314d590235c2bb513bc3091e8469108d289650cbc7a6d69c36581c0d2d92b9 -->
