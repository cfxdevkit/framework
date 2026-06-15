```text
API.md — API reference documentation
CHANGELOG.md — Version history and release notes
README.md — Project overview and usage guide
STRUCTURE.md — This file: directory layout documentation
moon.yml — Moonrepo workspace configuration
package.json — Package metadata and scripts
src
  app.ts — Hono app factory with keystore routes mounted
  index.ts — Public entry point (re-exports main API)
  keystore
    domain.ts — Core domain types and interfaces
    operations.ts — Business logic operations (CRUD, auth)
    runtime.ts — Runtime-specific implementations (e.g., DB, crypto)
  keystore.ts — High-level keystore service abstraction
  routes
    keystore.ts — HTTP route handlers for keystore endpoints
tsconfig.json — TypeScript compiler configuration
vite.config.ts — Vite build configuration (for dev/test)
```

<!-- structure-status: enriched -->
<!-- structure-hash: 6690cc03a070d1c3a33623b1d09d12888f74db64e1f5268d1d42e2c133e8d6ec -->
