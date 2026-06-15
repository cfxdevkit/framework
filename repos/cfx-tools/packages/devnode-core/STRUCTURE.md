```text
API.md — API reference documentation
README.md — Package overview and usage guide
STRUCTURE.md — This file: directory layout documentation
moon.yml — Moon configuration (e.g., build, lint, release)
package.json — Package metadata and scripts
src/
  app.ts — Hono app setup and middleware registration
  contracts.ts — Contract ABI and deployment helpers
  controller.ts — Core business logic (node control, compilation, mining)
  index.ts — Public entry point (re-exports main API)
  network.ts — Network state and RPC endpoint management
  routes/
    accounts-funding.ts — Account funding endpoint handlers
    accounts.ts — Account management endpoints
    compiler.ts — Solidity/Move compiler endpoints
    mining.ts — Mining control endpoints
    network.ts — Network configuration endpoints
  types.ts — Shared TypeScript types and interfaces
tsconfig.json — TypeScript compiler configuration
vite.config.ts — Vite build configuration (for dev/test)
```

<!-- structure-status: enriched -->
<!-- structure-hash: 6405bcde19507528855a0fb84ffb1b1a6a1cabcf97d0783a5f6e11ad4637a2ac -->
