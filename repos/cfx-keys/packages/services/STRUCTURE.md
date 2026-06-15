# `@cfxdevkit/services` — Structure

Pluggable backends: keystore, crypto, dex, tokens.

Workspace path: `repos/cfx-keys/packages/services`

## Directory Tree

```text
.gitignore
API.md
CHANGELOG.md
README.md
STRUCTURE.md
moon.yml
package.json
src
  auth
    index.ts — public auth module entry
    nonces.test.ts — nonce validation tests
    nonces.ts — nonce generation & validation logic
    token.test.ts — token handling tests
    token.ts — JWT-like token creation & parsing
  crypto
    aead.ts — authenticated encryption with associated data
    constants.ts — crypto constants & defaults
    encoding.ts — base64, hex, etc. encodings
    errors.ts — crypto-specific error types
    index.test.ts — crypto module tests
    index.ts — public crypto module entry
    kdf.ts — key derivation functions
    keys.ts — key generation & management
    random.ts — secure random bytes
  embedded-wallet
    index.ts — public embedded wallet entry
    manager.test.ts — wallet manager tests
    manager.ts — wallet lifecycle & session management
    types.ts — embedded wallet type definitions
  index.test.ts — root module tests
  index.ts — root module entry (re-exports)
  keystore
    audit.test.ts — keystore audit logging tests
    audit.ts — keystore audit trail implementation
    file
      index.test.ts — file keystore tests
      index.ts — file-based keystore backend
      internals.ts — internal file keystore helpers
    index.test.ts — keystore root tests
    index.ts — public keystore module entry
    ledger
      core — ledger-specific internal utilities (no files)
      index.test.ts — ledger keystore tests
      index.ts — ledger keystore entry
      provider.ts — ledger transport provider
      signature.ts — ledger signature handling
      signer.ts — ledger signing interface
      transport.ts — ledger transport abstraction
      types.ts — ledger-specific types
    memory
      capability.test.ts — memory keystore capability tests
      capability.ts — capability-based access control
      index.test.ts — memory keystore tests
      index.ts — in-memory keystore backend
tsconfig.json — TypeScript config
vite.config.ts — Vite build config (for dev/test)
vitest.config.ts — Vitest test config
```

<!-- structure-status: enriched -->
<!-- structure-hash: ee3ede7e84a44a0df7132138f8c18d793ff06a824345fda3f93435406727cb3c -->
