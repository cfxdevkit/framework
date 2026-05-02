# Backup and Recovery Policy

## Backup Rules

- KMS/HSM root keys must use provider-native backup, replication, or recovery mechanisms.
- Plaintext export of production private keys is not allowed.
- Recovery material must require at least two authorized maintainers or provider-enforced quorum.
- Recovery tests must use non-production keys unless the provider supports audited dry-run recovery.

## Recovery Procedure

1. Open an incident record and identify the affected secret owner.
2. Confirm whether recovery or rotation is safer for the affected deployment.
3. Restore through the managed backend or rotate to a new key if restoration would expose plaintext material.
4. Re-run deployment health checks and signing smoke tests.
5. Record audit-log references, operator identities, and follow-up actions.

## Local Development

Developer encrypted-file keystores are personal state. The repository does not back them up. Developers must store recovery mnemonics outside the workspace and never in source control.
