# Structure

```text
repos/cfx-llm/packages/llm-tools/
  src/
    bin.ts       # CLI entry point
    index.ts     # command registry and public metadata
    run.ts       # worker routing into shim dispatchers
  workers/
    llm-agents.ts    # Shim dispatcher into @cfxdevkit/llm-agents review/all
    lemonade/
      cli.ts         # Shim dispatcher into @cfxdevkit/llm-agents commands
  package.json
  tsconfig.json
  vite.config.ts
```

The implementation lives in sibling packages. Root `pnpm run llm:*` commands route through `src/run.ts`, keeping the public script surface stable while provider and workflow logic stay in `llm-client` and `llm-agents`.
