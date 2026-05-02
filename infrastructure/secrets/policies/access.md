# Secret Access Policy

## Access Model

- Grant least privilege by deployment, environment, and operation.
- Prefer OIDC federation and short-lived credentials over static secrets.
- Separate read, sign, deploy, and rotate permissions where the backend supports it.
- Production access requires named identities; shared accounts are not allowed.

## Reviews

| Scope | Cadence |
|-------|---------|
| Production signing and deployment secrets | monthly |
| CI publish credentials | monthly |
| Non-production service tokens | quarterly |
| Developer local keystores | user-owned |

Review records must include reviewer, date, removed access, retained exceptions, and follow-up tickets.
