```text
.gitignore — Git ignore rules
API.md — Public API documentation
README.md — Project overview and usage
STRUCTURE.md — This file: directory layout reference
moon.yml — Moonrepo workspace configuration
package.json — Package metadata and scripts
src/
  args.test.ts — CLI argument parsing tests
  args.ts — CLI argument parsing logic
  index.test.ts — Main entry point tests
  index.ts — Main entry point (CLI entry)
  scaffold.test.ts — Scaffolding logic tests
  scaffold.ts — Core scaffolding orchestration
  templates/
    minimal-dapp.ts — Minimal DApp template definition
    project-example/ — Template source files for project-example
      config.ts — Template config
      core.ts — Template core logic
      scripts.ts — Template scripts
    project-example.ts — Project example template definition
    types.ts — Shared template type definitions
    wallet-probe.ts — Wallet probing template logic
  templates.test.ts — Template system tests
  templates.ts — Template registry and loader
  validate.test.ts — Input validation tests
  validate.ts — Input validation utilities
tsconfig.json — TypeScript compiler configuration
vite.config.ts — Vite build config (for dev tooling)
vitest.config.ts — Vitest test runner config
```

<!-- structure-status: enriched -->
<!-- structure-hash: e6daba3a51306fe9ecf783dfd0c6d3b7425e85aeed61ae9288123db0d9cf9b55 -->
