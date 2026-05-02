# Security Findings and Mitigations

**Document Date:** 2026-05-02
**Scope:** Root repository security controls
**Classification:** Internal Use Only

## Current Posture

The repository now has an implemented baseline for CI validation, dependency scanning, disclosure handling, secret-leak checks, audit logging, project audit status, and release provenance. The remaining risk is operational hardening: production KMS/HSM backend wiring, real deployment audit sinks, and ongoing access reviews once deployments exist.

## Implemented Controls

| Area | Current control | Status |
|------|-----------------|--------|
| CI validation | `.github/workflows/ci.yml` installs with frozen lockfile, lints, typechecks, tests with bounded moon concurrency, and builds | Implemented |
| Dependency security | `.github/workflows/security.yml`, `.github/dependabot.yml`, `pnpm run security:audit` | Implemented |
| Static secret-leak checks | `pnpm run security:secrets` scans source for unsafe mnemonic/private-key/passphrase persistence or output patterns | Implemented |
| Disclosure process | `.github/SECURITY.md` and `SECURITY.md` document private reporting and response targets | Implemented |
| Keystore audit logging | `@cfxdevkit/services/keystore-audit` writes hash-chained append-only audit events; VS Code file-keystore operations use it | Implemented for local/devcontainer use |
| Plaintext mnemonic handling | VS Code extension no longer writes mnemonics to workspace state or output channels | Implemented |
| Project audit status | Each current project root has an `AUDITS.md` status file | Implemented |
| Release provenance | `.github/workflows/release.yml` publishes packages with npm provenance from CI releases | Implemented |
| Secret operations | `infrastructure/secrets/` contains rotation, recovery, access, and audit-retention policies | Implemented |

## Current Findings

### 1. Production keystore backends are policy-defined, not deployment-wired

**Severity:** High
**Status:** Open until production deployments exist

The repository defines the keystore provider interface, encrypted file backend, audit contract, and operational policies. Production deployment wiring for KMS/HSM/Vault-backed signing is still deployment-owned and must be completed before any mainnet write path is enabled.

**Required control before production:** deploy a managed KMS/HSM/Vault backend, route audit events to the platform audit sink, and verify session-key-only automated signing.

### 2. Audit logging is append-only locally but not yet centralized

**Severity:** Medium
**Status:** Partially implemented

Local and devcontainer file-keystore operations write hash-chained JSONL audit events to `.cfxdevkit/audit.log`. Production deployments still need a centralized append-only sink with retention, alerting, and restricted reader access.

**Required control before production:** configure the platform audit sink described in `infrastructure/secrets/policies/audit-retention.md`.

### 3. Release publishing workflow exists but needs real npm environment setup

**Severity:** Medium
**Status:** Implemented workflow, operational setup required

`.github/workflows/release.yml` uses npm provenance and GitHub OIDC permissions. Publishing requires repository/environment configuration for npm trusted publishing or `NPM_TOKEN` until trusted publishing is enabled.

**Required control before first release:** configure npm package access, repository environments, and release approval rules.

### 4. Project audit files currently record no contract scope

**Severity:** Low
**Status:** Implemented baseline

Current projects do not have `contracts/` directories. Their `AUDITS.md` files record that no project-local contract audit scope exists. If a project adds contracts, its audit file must be updated in the same change.

### 5. Static secret-leak checks are pattern-based

**Severity:** Low
**Status:** Implemented baseline

`scripts/check-secret-leaks.mjs` catches the unsafe patterns that caused the VS Code extension mnemonic issue. It is intentionally narrow to avoid blocking legitimate devnode mnemonic APIs and tests. A future AST-based rule can improve precision if the source surface grows.

## Validation Commands

Run these from the repository root to validate the current security baseline:

```sh
pnpm run security:check
pnpm run lint
pnpm run typecheck
pnpm exec moon run :test --concurrency 4
pnpm run build
```

## Operational Requirements

- Production secrets must follow `infrastructure/secrets/README.md` and the policy files under `infrastructure/secrets/policies/`.
- Project contracts require an updated project `AUDITS.md` before deployment.
- Release publishing must happen through `.github/workflows/release.yml` so npm provenance is attached.
- Security-relevant changes should include CI evidence from `security:check`, lint, typecheck, tests, and build.
