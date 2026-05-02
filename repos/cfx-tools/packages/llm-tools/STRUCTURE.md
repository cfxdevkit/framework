# Structure

```text
repos/cfx-tools/packages/llm-tools/
  src/
    bin.ts       # CLI entry point
    index.ts     # command registry and public metadata
    run.ts       # worker routing into Lemonade and deterministic agents
  workers/
    lemonade-cli.mjs # Lemonade/Pi delegated actions and commit harness
    llm-agents.mjs   # Deterministic corpus/docs/review/eval agents
  package.json
  tsconfig.json
  vite.config.ts
```

Root `scripts/` files are compatibility shims. The implementation lives here so future migrations can split worker internals into typed modules without changing root `pnpm run llm:*` commands.
