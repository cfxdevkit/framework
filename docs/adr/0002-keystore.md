# ADR-0002 — Keystore Strategy

- **Status:** Accepted (Phase 1)
- **Date:** 2026-04-28

## Context

We need to manage signing keys across very different surfaces:

- a developer's laptop,
- a portable **devcontainer** (no native OS keyring inside the container),
- CI runners,
- a long-running keeper worker on a server,
- an embedded ESP32 device,
- AI agents (MCP server) that must never see raw keys.

A single keystore implementation cannot satisfy all of these. `keytar` (the historical default) has been **unmaintained for ~4 years** and was dropped by VS Code itself.

## Decision

Define a single **`KeystoreProvider`** interface in `framework/services` and ship multiple backends. Each environment selects its backend via configuration; application code never imports a backend directly.

### Backends

| Backend | Package | Used in |
|---------|---------|---------|
| `keystore-kms` | `framework/services/keystore-kms` | production, CI for mainnet ops |
| `keystore-os` | `framework/services/keystore-os` (built on `@napi-rs/keyring`) | host developer machines |
| `keystore-file` | `framework/services/keystore-file` (AES-256-GCM, Argon2id-derived KEK; SOPS+age compatible export) | devcontainers, fallback |
| `keystore-forward` | `framework/services/keystore-forward` (host-keyring socket forwarded into the container) | advanced devcontainer setups |
| `keystore-memory` | `framework/services/keystore-memory` | tests only |

### Signing model

- **Session keys** are the default for any automated signer. They are short-lived, scoped to a capability set, and derived in memory from a parent key that lives in a real backend. Implemented in `framework/wallet/session-key`.
- **Raw private keys** may only be loaded by interactive user action (e.g. `cfx-keystore unlock`).
- **Hardware wallets** (Ledger) are the recommended root-of-trust for any mainnet write.

### Forbidden

- `keytar` (unmaintained).
- Plain-text key files anywhere in the repo.
- Logging key material (enforced by a Biome lint rule shipped in `repos/cfx-config/packages/biome-config`).
- Long-lived private keys in CI secrets — use OIDC-issued short-lived tokens.

## Consequences

**Positive**
- One API across all environments; switching backends is a config change.
- Devcontainer is genuinely portable (file backend works offline; can be swapped for OS keyring forwarding when desired).
- Production stays HSM/KMS-backed without polluting dev DX.

**Negative**
- More packages to maintain than a single keystore.
- The forwarding backend is OS-specific and documented as "advanced".

## Open questions (Phase 2)

- Picking the default file format: raw AES-GCM blob vs SOPS+age. Leaning SOPS+age because it composes with secret managers.
- Whether to provide a TUI (`cfx-keystore`) in `platform/devtools/` for interactive unlock.
- Session-level wallet selection, network alignment, and client invalidation are
  tracked in [Keystore Session Provider](../architecture/keystore-session-provider.md). The showcase
  now has an initial in-memory session provider; encrypted file/OS/KMS session
  wiring remains Phase 2 work.
