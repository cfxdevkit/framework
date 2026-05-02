# Structure

```text
repos/cfx-tools/packages/llm-tools/
  src/
    bin.ts       # CLI entry point
    index.ts     # command registry and public metadata
    run.ts       # worker routing into Lemonade and deterministic agents
  workers/
    lemonade-cli.ts # Lemonade/Pi delegated actions, docs upkeep, and commit harness
    llm-agents.ts   # Deterministic corpus/docs/review/eval agents
  package.json
  tsconfig.json
  vite.config.ts
```

Root `scripts/` files are compatibility shims. The implementation lives here as TypeScript source so future migrations can split worker internals into smaller typed modules without changing root `pnpm run llm:*` commands.
