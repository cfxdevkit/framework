# Secrets Operations

This directory contains operational policies, templates, and guidance only. Do not commit raw secrets—including plaintext key material, decrypted SOPS files, wallet mnemonics, private keys, API tokens, or production credentials.

## Current Controls

- Production secrets must live in a managed secret store such as AWS KMS, GCP KMS, HashiCorp Vault, or GitHub Actions OIDC-backed environment secrets.
- CI uses OIDC or short-lived tokens where supported. Long-lived private keys are not allowed in repository secrets.
- Developer fallback keystores are encrypted locally and must be treated as personal development state.
- Keystore audit events are written through append-only, hash-chained audit sinks. Production deployments must route those events to the platform audit sink.

## Required Records

Every production secret must have an owner, purpose, storage backend, rotation interval, recovery procedure, and access-review cadence recorded in the deployment runbook that consumes it.

## Policies

- [Rotation](policies/rotation.md)
- [Backup and Recovery](policies/backup-recovery.md)
- [Access Reviews](policies/access.md)
- [Audit Retention](policies/audit-retention.md)
