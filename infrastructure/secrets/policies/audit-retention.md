# Audit Retention Policy

## Retention

| Audit stream | Minimum retention |
|--------------|-------------------|
| Production keystore reads/writes/signing | 1 year |
| CI publish and provenance events | 1 year |
| Access review records | 2 years |
| Development append-only audit logs | user/workspace-owned |

## Requirements

- Production audit events must be append-only and tamper-evident.
- Audit logs must not contain private keys, mnemonics, passphrases, raw transaction secrets, or decrypted secret values.
- Production sinks must restrict write access to workload identities and read access to security/operations maintainers.
- Alerting must cover failed signing attempts, unexpected key access, audit sink write failures, and access outside deployment windows.
