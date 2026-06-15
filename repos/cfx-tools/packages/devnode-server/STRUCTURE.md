```text
.gitignore — Git ignore rules
API.md — Public API documentation
CHANGELOG.md — Version history
README.md — Package overview and usage
STRUCTURE.md — This file: directory layout reference
lint_output.txt — Linter output log (auto-generated)
moon.yml — Moonrepo workspace config
package.json — Package metadata and scripts
precommit_output.txt — Pre-commit hook output log (auto-generated)
src/
  app.ts — Main Hono app setup
  cli-helpers.ts — CLI utility functions
  cli.test.ts — CLI tests
  cli.ts — CLI entry point
  index.basics.test.ts — Basic functionality tests
  index.contracts-persistence.test.ts — Contracts persistence tests
  index.deploy.test.ts — Contract deployment tests
  index.keystore.test.ts — Keystore tests
  index.network.test.ts — Network configuration tests
  index.node-profiles.test.ts — Node profile tests
  index.test-support.ts — Shared test helpers
  index.test.ts — Core integration tests
  index.ts — Public entry point (Hono server)
  keystore/ — Keystore-related utilities and types
  profiles.ts — Node profile management logic
  routes/
    bootstrap.ts — Bootstrap route handlers
    contracts/
      actions.ts — Contract actions (deploy, call, etc.)
      helpers.ts — Contract route helpers
    contracts.ts — Contracts route group
    deploy.ts — Deployment-specific routes
    node-profile.ts — Node profile management routes
    session-key.ts — Session key management routes
  runtime-operations.ts — Runtime control operations (start/stop/restart)
  test-setup.ts — Test environment setup
test_output.log — Test runner output log (auto-generated)
tsconfig.json — TypeScript configuration
vite.config.ts — Vite build config (for dev/test)
```

<!-- structure-status: enriched -->
<!-- structure-hash: 27ec372a67b67f339cf06ff7caf11c8b0fc7a780e059e8eec057d42df184d535 -->
