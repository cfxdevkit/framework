# framework/services

**Scope:** Stateless service primitives sitting just above `core`.

**Responsibilities**
- AES-256-GCM encryption helpers
- Encrypted keystore format + read/write
- DEX adapters (Swappi today; pluggable interface for future DEXs)
- Token metadata service

Depends on: `core` only.
