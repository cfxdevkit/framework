```text
.gitignore — Git ignore rules
API.md — Public API reference
CHANGELOG.md — Version history
README.md — Package overview and usage
STRUCTURE.md — This file: directory layout documentation
moon.yml — Moon repo configuration
package.json — Package metadata and scripts
src — Source code root
  batcher — Batched transaction signing logic
    index.test.ts — Batcher unit tests
    index.ts — Batcher public API
    types.ts — Batcher type definitions
  errors — Custom error types and utilities
    index.test.ts — Error unit tests
    index.ts — Error exports
  hardware — Hardware wallet integration layer
    index.test.ts — Hardware wallet tests
    index.ts — Hardware wallet entry point
    ledger — Ledger hardware wallet support
      index.test.ts — Ledger tests
      index.ts — Ledger integration
    onekey — OneKey hardware wallet support
      core.ts — Core OneKey logic
      helpers.ts — Helper utilities
      index.test.ts — OneKey tests
      index.ts — OneKey entry point
    satochip — Satochip hardware wallet support
      helpers.ts — Helper utilities
      index.test.ts — Satochip tests
      index.ts — Satochip entry point
    types.test.ts — Hardware wallet type tests
    types.ts — Shared hardware wallet types
  index.test.ts — Root module tests
  index.ts — Main package entry point
  init — Wallet initialization logic
    index.test.ts — Init tests
    index.ts — Initialization API
  policies — Capability-based access control policies
    index.test.ts — Policy tests
    index.ts — Policy definitions and helpers
  session-key — Session key generation and management
    index.test.ts — Session key tests
    index.ts — Session key API
  signers — Transaction signing implementations
    index.test.ts — Signer tests
    index.ts — Signer entry point
tsconfig.json — TypeScript compiler configuration
vite.config.ts — Vite build configuration (for dev/build)
vitest.config.ts — Vitest test runner configuration
```

<!-- structure-status: enriched -->
<!-- structure-hash: 569352e560e22b26b0f2a8ae1be0fb609a6cb02773d1050809623fb7718cfb51 -->
