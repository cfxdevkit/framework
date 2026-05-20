# API

`@cfxdevkit/llm-tools` exposes command metadata for tooling integrations.

```ts
import { llmCommands, findLlmCommand } from '@cfxdevkit/llm-tools';
```

The runtime CLI is available as `cfx-llm` after building the package, and can be invoked via the package script during workspace development:

```bash
pnpm --filter @cfxdevkit/llm-tools llm -- <command>
```

The deterministic hotspot scanner is available through the same CLI surface:

```bash
pnpm --filter @cfxdevkit/llm-tools llm -- hotspots --fail-on-hard
```
