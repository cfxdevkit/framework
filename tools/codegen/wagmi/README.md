# tools/codegen/wagmi

Per-project [wagmi](https://wagmi.sh) codegen wrapper convention.

> **Status:** Convention placeholder — no package.json.
>
> Each project that needs React hooks for its contracts should add its own `wagmi.config.ts` (extending a shared base) and run `wagmi generate`. This folder documents the agreed pattern; no shared runtime code lives here.

## Pattern

```ts
// projects/<my-app>/wagmi.config.ts
import { defineConfig } from '@wagmi/cli';
import { hardhat } from '@wagmi/cli/plugins';

export default defineConfig({
  out: 'src/generated/wagmi.ts',
  plugins: [hardhat({ project: '../contracts' })],
});
```

See [tools/STRUCTURE.md](../../STRUCTURE.md) for the broader codegen layout.
