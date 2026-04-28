# Security Model

> This file documents the **security boundaries between tiers**.
> Detailed threat models per component are produced in Phase 2 reviews.

## Trust tiers

| Tier | Trust level | Notes |
|------|-------------|-------|
| framework/ | **Public, audited** | Published to npm, semver, must be safe for third-party consumption |
| platform/  | **Internal, semi-trusted** | Devcontainer + AI agent surface; tool allowlists required |
| domains/   | **Internal, audited per package** | Reviewed when promoted from a project |
| projects/  | **Application-level** | Each project owns its own threat model |
| infrastructure/ | **Operational** | Secrets via env + secret manager; never committed |

## Key handling — layered keystore model

Decision recorded in [docs/adr/0002-keystore.md](docs/adr/0002-keystore.md).
Implementation owned by [framework/services](framework/services/README.md) and [framework/wallet](framework/wallet/README.md).

We do **not** rely on a single keystore. We provide pluggable backends through a single
`KeystoreProvider` interface so the same code path works on a developer laptop, inside a
devcontainer, in CI, and in production.

| Environment | Backend | Implementation package |
|-------------|---------|------------------------|
| Production / deploy | Cloud KMS or HSM (AWS KMS, GCP KMS, HashiCorp Vault, Ledger) | `framework/services/keystore-kms` |
| Host developer machine | OS keyring via `@napi-rs/keyring` (macOS Keychain, Windows Credential Manager, Linux libsecret) | `framework/services/keystore-os` |
| Devcontainer | Encrypted file (AES-256-GCM, key derived from passphrase via Argon2id) **or** SOPS+age file unlocked at session start | `framework/services/keystore-file` |
| Devcontainer (advanced) | Forwarded host agent (libsecret D-Bus socket / ssh-agent style mount) | `framework/services/keystore-forward` |
| CI | Repository secrets / OIDC-issued short-lived tokens; never a long-lived private key | n/a (env-only) |
| Runtime signing for automation | **Session keys** — short-lived, capability-scoped, derived in memory only | `framework/wallet/session-key` |

### Rules

1. **No long-lived private key in any committed file.** Pre-commit hook scans (`tools/git-hooks/`).
2. **The encrypted-file backend is the *fallback*, never the recommendation** for environments that have a real keystore.
3. **`keytar` is forbidden.** It is unmaintained; new code MUST use `@napi-rs/keyring`.
4. **Session keys are the default signer for any automated process** (keeper, MCP tool, hardware backend). Raw private keys may only be loaded by an interactive user action.
5. **Devcontainer images** ship with the file backend pre-installed but no key material baked in.
6. **All keystore reads/writes are audit-logged** to a project-local append-only file in dev, and to the platform's audit sink in production.

## Supply chain

- pnpm with frozen lockfile in CI.
- Dependabot or Renovate at root, scoped per tier.
- `framework/*` packages publish provenance attestations.
- No `postinstall` scripts in `framework/` packages.

## AI / MCP surface (`platform/mcp-server/`)

- Explicit allowlist of tools exposed to agents.
- No tool may sign a transaction with a non-session key.
- Any tool that performs network writes must require explicit user confirmation in its contract.

## Smart contract security

- Each `projects/<p>/contracts/` directory owns its audit history (`AUDITS.md`).
- ABIs published from `framework/contracts/` are derived from audited sources only.
- Test coverage thresholds enforced in CI.

## Cross-tier rule

A higher tier may never weaken the security stance of a lower tier (e.g. a project cannot
re-export an unsafe wrapper of `framework/services` keystore that bypasses encryption).
