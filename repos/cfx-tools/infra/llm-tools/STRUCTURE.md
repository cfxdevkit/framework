```text
.gitignore — Git ignore rules
API.md — API documentation
README.md — Package overview and usage
STRUCTURE.md — This file: directory layout documentation
artifacts
  llm
    reports — Generated LLM-related reports (e.g., benchmarks, logs)
moon.yml — Moon repo configuration (monorepo tooling)
package.json — Package metadata and dependencies
src
  bin.ts — CLI entry point
  commands.ts — CLI command definitions
  index.ts — Main module export
  namespace.ts — Namespace/type definitions
  run.test.ts — Unit/integration tests for `run.ts`
  run.ts — Core execution logic (e.g., LLM orchestration)
tsconfig.json — TypeScript compiler configuration
vite.config.ts — Vite bundler config (for workers or dev tooling)
workers
  lemonade
    cli.ts — Lemonade worker CLI entry point
  llm-agents.ts — LLM agent worker implementation
```

<!-- structure-status: enriched -->
<!-- structure-hash: cff94119e71e63acbbf25a077c299da38745de914c69f3623e90340c4e84eed3 -->
