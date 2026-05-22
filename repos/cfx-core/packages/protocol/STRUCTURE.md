```text
.gitignore — Git ignore rules
API.md — API documentation
README.md — Package overview and usage
STRUCTURE.md — This file: directory layout documentation
moon.yml — Moonbeam workspace configuration
package.json — Package metadata and dependencies
src
  abi.ts — ABI definitions for precompiles
  generated.ts — Auto-generated types/constants (e.g., from Solidity)
  index.test.ts — Core module unit tests
  index.ts — Main entry point (re-exports public API)
  integration.test.ts — Integration tests (e.g., with testnet/devnet)
  precompiles
    addresses.ts — Precompile address constants (hex strings)
    admin-control.ts — Admin control precompile interface & types
    cross-space-call.ts — Cross-space call precompile interface & types
    index.ts — Precompiles module entry point (re-exports)
    pos-register.ts — POS registration precompile interface & types
    sponsor-whitelist.ts — Sponsor whitelist precompile interface & types
    staking.ts — Staking precompile interface & types
    wcfx.ts — Wrapped CFX (wCFX) precompile interface & types
  precompiles.test.ts — Precompiles module unit tests
  precompiles.ts — Precompiles module implementation (logic, helpers)
tsconfig.json — TypeScript configuration
vite.config.ts — Vite build configuration (for bundling)
vitest.config.ts — Vitest test configuration
```

<!-- structure-status: enriched -->
<!-- structure-hash: f4aa6ea7fce5a8a5e34d14c07dbe5bc3a5c35bea262f32ec595075ea2f747a35 -->
