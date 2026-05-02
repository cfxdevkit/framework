# Security Model

## Reporting Vulnerabilities

Report suspected vulnerabilities privately by emailing `info@cfxdevkit.org`.
Do not open a public issue for exploitable bugs, leaked secrets, key-handling
failures, transaction-signing bypasses, or supply-chain compromise reports.

Response targets:

| Stage | Target |
|-------|--------|
| Initial acknowledgement | 2 business days |
| Triage and severity assignment | 5 business days |
| Remediation plan for confirmed high/critical issues | 10 business days |
| Coordinated public disclosure | after fix availability, unless otherwise agreed |

The repository is currently pre-release. Security fixes target `main` first and
are backported only to actively maintained release branches once they exist.

This file documents the current security boundaries, automation, and operational
controls for this workspace.

## Trust tiers

| Current area | Trust level | Notes |
|--------------|-------------|-------|
| `repos/cfx-core`, `repos/cfx-keys`, `repos/cfx-ui`, `repos/cfx-solidity` | **Public package surface** | npm-facing libraries; semver and provenance required when published |
| `repos/cfx-tools` | **Developer tooling surface** | CLI, MCP, scaffolding, VS Code extension, and agent-facing tools |
| `repos/cfx-domain` | **Reusable domain surface** | Domain libraries reviewed before promotion into production applications |
| `projects/` | **Application-level** | Each project owns its app threat model and audit status |
| `infrastructure/` | **Operational** | Secrets via managed backends; templates and policy only in git |

## Key handling — layered keystore model

Decision recorded in [docs/adr/0002-keystore.md](docs/adr/0002-keystore.md).
Implementation is currently owned by `repos/cfx-keys/packages/services` and
`repos/cfx-keys/packages/wallet`.

We do **not** rely on a single keystore. We provide pluggable backends through a single
`KeystoreProvider` interface so the same code path works on a developer laptop, inside a
devcontainer, in CI, and in production.

| Environment | Backend | Implementation package/status |
|-------------|---------|-------------------------------|
| Production / deploy | Cloud KMS or HSM (AWS KMS, GCP KMS, HashiCorp Vault, Ledger) | Interface and policy defined; production backend wiring is deployment-owned |
| Host developer machine | OS keyring via `@napi-rs/keyring` | Planned backend; file backend remains the portable fallback |
| Devcontainer | Encrypted file, AES-256-GCM with Argon2id-derived KEK | `@cfxdevkit/services/keystore-file` |
| CI | GitHub OIDC or short-lived publish/deploy tokens | CI workflow secrets only; no long-lived private keys |
| Runtime signing for automation | Session keys, short-lived and capability-scoped | `@cfxdevkit/wallet/session-key` |

### Rules

1. **No long-lived private key in any committed file.** CI runs `pnpm run security:secrets`.
2. **The encrypted-file backend is the *fallback*, never the recommendation** for environments that have a real keystore.
3. **`keytar` is forbidden.** It is unmaintained; new code MUST use `@napi-rs/keyring`.
4. **Session keys are the default signer for any automated process** (keeper, MCP tool, hardware backend). Raw private keys may only be loaded by an interactive user action.
5. **Devcontainer images** ship with the file backend pre-installed but no key material baked in.
6. **All file-keystore reads/writes are audit-logged** through `@cfxdevkit/services/keystore-audit`. Local VS Code usage writes a hash-chained append-only log at `.cfxdevkit/audit.log`; production deployments must route equivalent events to the platform audit sink.

## Supply chain

- pnpm with frozen lockfile in CI.
- Dependabot or Renovate at root, scoped per tier.
- `pnpm run security:audit` runs `pnpm audit --prod --audit-level moderate`.
- `pnpm run security:secrets` rejects unsafe plaintext secret logging or VS Code state persistence patterns.
- `.github/workflows/release.yml` publishes packages with npm provenance when releases are cut from CI.
- Published package surfaces must not add `postinstall` scripts without security review.

Current automation lives in `.github/workflows/ci.yml`, `.github/workflows/security.yml`,
`.github/workflows/release.yml`, and `.github/dependabot.yml`.

## AI / MCP surface (`repos/cfx-tools/packages/mcp-server/`)

- Explicit allowlist of tools exposed to agents.
- No tool may sign a transaction with a non-session key.
- Any tool that performs network writes must require explicit user confirmation in its contract.

## Smart contract security

- Each project root owns an `AUDITS.md` status file. If `projects/<p>/contracts/` is added, that file must list every contract audit, review, deployment artifact, and remediation.
- ABIs published from `repos/cfx-solidity` packages must be derived from reviewed sources only.
- Test coverage thresholds enforced in CI.

## Cross-tier rule

A higher-level app or tool may never weaken the security stance of a reusable package (for example,
a project cannot re-export an unsafe wrapper of `@cfxdevkit/services` keystore APIs that bypasses encryption).
