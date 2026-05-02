# @cfxdevkit/wallet

**Scope:** Focused wallet primitives — session keys, capability-scoped signers, batched transactions.

**Responsibilities**
- Session key generation and lifecycle
- Capability/policy attached to a signer
- Batched transaction helpers (multicall + multisend)
- Re-exports a curated subset of `core` wallet APIs

Depends on: `@cfxdevkit/core`, `@cfxdevkit/services` (for keystore).

Security note: this package is the **only** blessed entrypoint for automated signers.
