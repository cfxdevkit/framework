# Structure

```text
repos/cfx-llm/packages/llm-tools/
  src/
    bin.ts       # CLI entry point
    index.ts     # command registry and public metadata
    run.ts       # worker routing into Lemonade and deterministic agents
  workers/
    code-hotspots.ts # Source-size and churn scanner for review and commit gates
    llm-agents.ts    # Deterministic corpus/docs/review/eval agents
    agents/
      runtime/       # Shared deterministic-agent helpers and report rendering
    lemonade/
      cli.ts         # Lemonade/Pi command dispatcher
      commands.ts    # Models, config, ask, and named repo actions
      completion/    # Lemonade client, completion, Pi bridge, context, JSON, runner
      commit/        # Commit pipeline, gates, scope, changelog, and message helpers
      docs/          # Documentation upkeep discovery, generation, validation, writes
      shared/        # Lemonade constants, repo actions, quality gates, logging helpers
      tests/         # Test upkeep discovery, baseline, generation, and writes
  package.json
  tsconfig.json
  vite.config.ts
```

The implementation lives here as TypeScript source. Root `pnpm run llm:*` commands route through `src/run.ts`, so worker internals can keep moving into domain folders without changing the public script surface.
