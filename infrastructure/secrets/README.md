# Secrets Operations

This directory contains operational policies, templates, and guidance only. Do not commit raw secrets—including plaintext key material, decrypted SOPS files, wallet mnemonics, private keys, API tokens, or production credentials.

## Current Controls

- Production secrets must live in a managed secret store such as AWS KMS, GCP KMS, HashiCorp Vault, or GitHub Actions OIDC-backed environment secrets.
- CI uses OIDC or short-lived tokens where supported. Long-lived private keys are not allowed in repository secrets.
- Developer fallback keystores are encrypted locally and must be treated as personal development state.
- Keystore audit events are written through append-only, hash-chained audit sinks. Production deployments must route those events to the platform audit sink.

## Required Records

Every production secret must have an owner, purpose, storage backend, rotation interval, recovery procedure, and access-review cadence recorded in the deployment runbook that consumes it.

## GitHub Actions Secrets and Variables

| Name | Type | Used by | Purpose |
| --- | --- | --- | --- |
| `VPS_HOST` | secret | `deploy-docs.yml` | Hetzner VPS public IP or host name |
| `VPS_SSH_KEY` | secret | `deploy-docs.yml` | Private key for the VPS `deploy` user |
| `GHCR_TOKEN` | secret | `deploy-docs.yml` | Optional PAT with `read:packages` when GHCR images are private |
| `GHCR_USERNAME` | variable | `deploy-docs.yml` | Optional GHCR username; defaults to `cfxdevkit` |
| npm trusted publishing | external config | `release.yml`, `changeset-release.yml` | Configure each public package on npmjs.com for OIDC publishing from this repository |

## Policies

- [Rotation](policies/rotation.md)
- [Backup and Recovery](policies/backup-recovery.md)
- [Access Reviews](policies/access.md)
- [Audit Retention](policies/audit-retention.md)
