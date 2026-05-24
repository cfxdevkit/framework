# `@cfxdevkit/cdk-ai`

**Dynamic module boundary for `tooling-cli`.** This package is not a general-purpose library.

## Purpose

`cdk-ai` is a pure re-export barrel:

```ts
export * from '@cfxdevkit/llm-agents';
export * from '@cfxdevkit/pi-agent';
```

It serves one specific role in the `tooling-cli` architecture: `agent-runtime.ts` uses
`@cfxdevkit/cdk-ai` as the **dynamic module resolution specifier**. The existence of
`packages/cdk-ai/dist/index.js` is the signal that the repository has been built and
the runtime is ready to load.

This pattern prevents `tooling-cli` from having a hard build-time dependency on
`llm-agents` or `pi-agent` at the source level — both are loaded dynamically at runtime.

## What to import from

If you need LLM agent functionality, import directly:

```ts
import { runCommit, validateModels } from '@cfxdevkit/llm-agents';
import { type PiAgent } from '@cfxdevkit/pi-agent';
```

Do **not** import from `@cfxdevkit/cdk-ai` in application code.

## Build signal

```ts
// agent-runtime.ts
function hasBuiltCdkAiRuntime(): boolean {
  return existsSync(cdkAiDistEntry)   // cdk-ai/dist/index.js
      && existsSync(piAgentDistEntry)  // pi-agent/dist/index.js
      && existsSync(llmAgentsDistEntry); // llm-agents/dist/index.js
}
```

When this returns `false`, the runtime falls back to loading source files via `tsx`.
