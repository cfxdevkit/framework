# Secret Rotation Policy

## Rotation Cadence

| Secret type | Required cadence | Triggered rotation |
|-------------|------------------|--------------------|
| Production signing roots | Hardware/KMS policy, at least annual review | suspected exposure, maintainer departure, custody change |
| Session-signing credentials | 24 hours or less | scope change, suspicious activity, deployment rollback |
| CI publish tokens | Prefer OIDC; otherwise 90 days | workflow compromise, maintainer departure |
| RPC/API tokens | 90 days | provider incident, quota abuse, leaked logs |
| Development keystore passphrases | User-owned | device loss, shared-screen exposure, suspected compromise |

## Procedure

1. Create the replacement secret in the managed backend.
2. Deploy consumers that can read the replacement without removing the old value.
3. Verify health checks, audit events, and transaction signing behavior.
4. Revoke the old secret.
5. Record the rotation date, operator, affected deployments, and verification evidence in the deployment runbook.

Emergency rotations skip step 2 only when continued old-secret access is an active risk.
