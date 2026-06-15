```text
API.md — Public API reference
CHANGELOG.md — Version history
README.md — Package overview and usage
STRUCTURE.md — This file — directory layout documentation
moon.yml — Moonrepo workspace config
package.json — Package metadata and scripts
src/
  backends/
    file-keystore.ts — File-based keystore backend (e.g., local JSON files)
    ledger.ts — Ledger hardware wallet backend
    memory.ts — In-memory signer backend (for testing/dev)
    onekey.ts — OneKey hardware wallet backend
  config.ts — Session and backend configuration types/helpers
  index.test.ts — Unit/integration tests
  index.ts — Public entry point (exports signer session factory)
  types.ts — Shared TypeScript types (Signer, Session, etc.)
  workspace-root.ts — Workspace root detection utility
tsconfig.json — TypeScript compiler options
vite.config.ts — Vite build config (for dev/test)
```

<!-- structure-status: enriched -->
<!-- structure-hash: 41db497c69f5961c95c8b836166c8ff0e93e34d81c30dc3f8e4efd5cfdbd2349 -->
