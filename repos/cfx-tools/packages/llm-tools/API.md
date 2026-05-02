# API

`@cfxdevkit/llm-tools` exposes command metadata for tooling integrations.

```ts
import { llmCommands, findLlmCommand } from '@cfxdevkit/llm-tools';
```

The runtime CLI is available as `cfx-llm` after build, and through the package script during workspace development:

```bash
pnpm --filter @cfxdevkit/llm-tools llm -- <command>
```
