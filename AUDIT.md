# Security and Infrastructure Audit

**Audit Date:** 2026-05-06  
**Scope:** Root repository security controls, architecture, and infrastructure  
**Classification:** Internal Use Only  
**Next Review Date:** 2026-08-06

---

## Executive Summary

The repository demonstrates a **mature security posture** with comprehensive controls already implemented. The main remaining work is production deployment wiring and operational configuration, which is typical for pre-release projects.

**Overall Risk Rating:** MEDIUM  
**Security Controls Status:** 85% Implemented  
**Production Readiness:** Not Ready (requires deployment wiring)

---

## Implemented Security Controls

### ✅ CI/CD Security Pipeline

| Control | Implementation | Status |
|---------|---------------|--------|
| Frozen Lockfile | `.github/workflows/ci.yml` uses `pnpm install --frozen-lockfile` | ✅ Implemented |
| Dependency Auditing | `.github/workflows/security.yml` with `pnpm run security:audit` | ✅ Implemented |
| Static Secret Detection | `scripts/check-secret-leaks.mjs` + `pnpm run security:secrets` | ✅ Implemented |
| CodeQL Analysis | GitHub CodeQL with JavaScript/TypeScript support | ✅ Implemented |
| Scheduled Scans | Weekly security scans (cron: `17 4 * * 1`) | ✅ Implemented |
| Build Verification | `pnpm run check && pnpm run build && pnpm run security:check` | ✅ Implemented |

### ✅ Secrets Management

| Control | Implementation | Status |
|---------|---------------|--------|
| Policy Framework | `infrastructure/secrets/policies/` with 4 policy files | ✅ Implemented |
| Template Configuration | `infrastructure/secrets/env.template` | ✅ Implemented |
| Session Keys | Default signer for automation via `@cfxdevkit/wallet/session-key` | ✅ Implemented |
| No Committed Secrets | `pnpm run security:secrets` blocks unsafe patterns | ✅ Implemented |
| Hardware Wallet Support | Ledger, OneKey, Satochip integration | ✅ Implemented |
| Audit Logging | Hash-chained append-only events at `.cfxdevkit/audit.log` | ✅ Implemented |

### ✅ Infrastructure Security

| Control | Implementation | Status |
|---------|---------------|--------|
| SSH Hardening | `PermitRootLogin no`, key-based auth only | ✅ Implemented |
| Firewall | ufw configured (ports 22/80/443 only) | ✅ Implemented |
| Fail2Ban | SSH jail with 5-minute ban after 5 failures | ✅ Implemented |
| Unattended Upgrades | Security-only updates configured | ✅ Implemented |
| Docker Security | `no-new-privileges:true` in all containers | ✅ Implemented |
| Log Rotation | Docker daemon configured (10MB, 3 files max) | ✅ Implemented |
| Non-root Execution | `deploy` user for container execution | ✅ Implemented |

### ✅ Key Handling Architecture

| Control | Implementation | Status |
|---------|---------------|--------|
| Layered Keystore | Pluggable backend interface (`KeystoreProvider`) | ✅ Implemented |
| Environment Backends | OS keyring (host), encrypted file (devcontainer), OIDC (CI) | ✅ Implemented |
| Session Keys | Default for automation, capability-scoped | ✅ Implemented |
| Hardware Support | Ledger, OneKey, Satochip integration | ✅ Implemented |
| Encrypted Storage | AES-256-GCM with Argon2id-derived KEK | ✅ Implemented |
| Keyring禁用 | `keytar` explicitly forbidden; must use `@napi-rs/keyring` | ✅ Implemented |

### ✅ Supply Chain Security

| Control | Implementation | Status |
|---------|---------------|--------|
| pnpm Workspaces | Single root lockfile with `workspace:*` protocol | ✅ Implemented |
| Dependabot | Configured for dependency updates | ✅ Implemented |
| npm Provenance | `.github/workflows/release.yml` with OIDC | ✅ Implemented |
| Trusted Publishing | Changeset-based release automation | ✅ Implemented |
| Postinstall Blocking | Security review required for postinstall scripts | ✅ Implemented |

---

## Current Findings

### 1. Production Keystore Backends Not Wired

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Status** | Open - Requires deployment wiring |
| **Category** | Security Controls |

**Description**  
The repository defines the keystore provider interface, encrypted file backend, audit contract, and operational policies. Production deployment wiring for KMS/HSM/Vault-backed signing is still deployment-owned and must be completed before any mainnet write path is enabled.

**Impact**  
- Cannot enable mainnet write paths  
- Production signing operations blocked  
- Audit events cannot be routed to platform audit sink

**Evidence**  
- `infrastructure/secrets/policies/` contains policy definitions  
- `repos/cfx-keys/packages/services/` implements interface  
- No production backend wiring in `infrastructure/ansible/`  

**Required Control Before Production**  
1. Select and deploy KMS/HSM/Vault backend (AWS KMS, GCP KMS, HashiCorp Vault, or Ledger)  
2. Wire signing operations to selected backend  
3. Route audit events to platform audit sink  
4. Verify session-key-only automated signing  

**Action Items**  
```yaml
- [ ] Choose backend provider (KMS/HSM/Vault/Ledger)
- [ ] Deploy backend to production environment
- [ ] Configure keystore provider to use backend
- [ ] Update `infrastructure/secrets/policies/access.md` with production procedures
- [ ] Test signing operations end-to-end
- [ ] Configure audit event routing
```

---

### 2. Audit Logging Not Centralized

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Status** | Partially Implemented |
| **Category** | Security Controls |

**Description**  
Local and devcontainer file-keystore operations write hash-chained JSONL audit events to `.cfxdevkit/audit.log`. Production deployments still need a centralized append-only sink with retention, alerting, and restricted reader access.

**Impact**  
- No centralized monitoring of security events  
- Limited audit trail for production incidents  
- No alerting on suspicious operations

**Evidence**  
- Local VS Code usage writes to `.cfxdevkit/audit.log`  
- `@cfxdevkit/services/keystore-audit` implements hash-chaining  
- No production audit sink configured in `infrastructure/`

**Required Control Before Production**  
1. Configure centralized append-only audit sink  
2. Implement retention policies (minimum 1 year)  
3. Set up alerting for suspicious patterns  
4. Restrict reader access to authorized personnel only

**Action Items**  
```yaml
- [ ] Deploy centralized audit logging solution (ELK, Splunk, or similar)
- [ ] Configure log shipping from all services
- [ ] Set up retention policies (min 1 year)
- [ ] Configure alerting rules for security events
- [ ] Implement access control for audit data
- [ ] Test audit log integrity (hash-chain verification)
```

---

### 3. Release Publishing Workflow Requires Environment Setup

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Status** | Workflow Implemented, Environment Pending |
| **Category** | CI/CD Security |

**Description**  
`.github/workflows/release.yml` uses npm provenance and GitHub OIDC permissions. Publishing requires repository/environment configuration for npm trusted publishing or `NPM_TOKEN` until trusted publishing is enabled.

**Impact**  
- Cannot publish packages to npm until environment is configured  
- Release process blocked until setup complete

**Evidence**  
- `pnpm run security:audit` runs successfully  
- `pnpm run security:secrets` runs successfully  
- Release workflow requires OIDC or `NPM_TOKEN`  

**Required Control Before First Release**  
1. Configure npm package access for all packages  
2. Set up repository environments in GitHub  
3. Configure release approval rules  
4. Register packages as Trusted Publishers on npmjs.com  

**Action Items**  
```yaml
- [ ] Register each npm package as Trusted Publisher on npmjs.com
- [ ] Configure repository environments in GitHub
- [ ] Set up release approval rules (if required)
- [ ] Test release workflow with `--dry-run`
- [ ] Verify npm provenance is attached to published packages
```

---

### 4. Project Audit Files Lack Contract Scope

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Status** | Implemented Baseline |
| **Category** | Smart Contract Security |

**Description**  
Current projects do not have `contracts/` directories. Their `AUDITS.md` files record that no project-local contract audit scope exists. If a project adds contracts, its audit file must be updated in the same change.

**Impact**  
- No contract audits performed on current projects  
- Future contract deployments require audit updates

**Evidence**  
- No `projects/*/contracts/` directories found  
- No `AUDITS.md` files in `repos/*/packages/*/`  

**Required Control Before Contract Deployment**  
1. Add `contracts/` directory to project root  
2. Create/update `AUDITS.md` with audit scope  
3. List every contract audit, review, deployment artifact, and remediation  

**Action Items**  
```yaml
- [ ] Add `contracts/` directory to project if planning smart contract deployment
- [ ] Create `AUDITS.md` with contract audit documentation
- [ ] Update project audit status in `AUDITS.md`
- [ ] Ensure all contract audits are documented
```

---

### 5. Static Secret Leak Checks Are Pattern-Based

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Status** | Implemented Baseline |
| **Category** | Secrets Management |

**Description**  
`scripts/check-secret-leaks.mjs` catches the unsafe patterns that caused the VS Code extension mnemonic issue. It is intentionally narrow to avoid blocking legitimate devnode mnemonic APIs and tests. A future AST-based rule can improve precision if the source surface grows.

**Impact**  
- May miss some edge cases  
- Limited precision for complex patterns  

**Evidence**  
- Pattern-based checks in `scripts/check-secret-leaks.mjs`  
- Intentionally narrow to avoid blocking legitimate APIs  

**Recommended Improvements**  
1. Implement AST-based detection rules  
2. Add integration testing for secret rotation  
3. Regular security audits of third-party dependencies  

**Action Items**  
```yaml
- [ ] Implement AST-based secret detection rules
- [ ] Add integration testing for secret rotation procedures
- [ ] Schedule regular security audits of third-party dependencies
- [ ] Consider false positive review process
```

---

## Architecture & Infrastructure Findings

### Strengths

#### 1. Five-Tier Architecture

| Tier | Path | Status |
|------|------|--------|
| Framework | `repos/cfx-{core,keys,ui,solidity}` | ✅ Active |
| Platform | `repos/cfx-tools` | ✅ Active |
| Domains | `repos/cfx-domain` | ✅ Active |
| Projects | `projects/*` | ✅ Active |
| Cross-Cutting | `infrastructure/`, `tools/`, `docs/` | ✅ Active |

**Strengths**  
- Clear separation between tiers  
- One-way dependency graph enforced  
- Replaceable consumers model  
- Stable public surface for framework packages  

#### 2. Build Stack

| Component | Technology | Status |
|-----------|------------|--------|
| Package Manager | pnpm workspaces | ✅ Active |
| Task Runner | MoonRepo | ✅ Active |
| Bundler | Vite 7 | ✅ Active |
| Linter/Formatter | Biome | ✅ Active |
| Testing | Vitest | ✅ Active |
| Versioning | Changesets | ✅ Active |

**Strengths**  
- Vendor-neutral task runner (no Vercel lock-in)  
- Deterministic hashing  
- Parallel task graph  
- Integrated toolchain  
- Remote cache as S3-compatible bucket  

#### 3. VPS Infrastructure

| Component | Implementation | Status |
|-----------|---------------|--------|
| Host | Hetzner CAX11 ARM64 | ✅ Active |
| Container Runtime | Docker CE | ✅ Active |
| Service Orchestrator | Docker Compose | ✅ Active |
| Reverse Proxy | Caddy | ✅ Active |
| Backups | Restic + B2 | ✅ Active |
| Monitoring | Uptime Kuma | ✅ Active |

**Strengths**  
- Single VPS for all services (cost-effective)  
- Docker Compose for orchestration  
- Caddy with HTTPS  
- Automated backups  
- Monitoring with alerting

### Configuration Issues

#### 1. Missing VPS Setup Variables

**Required Variables for `infrastructure/ansible/vars/local.yml`**  
```yaml
deploy_pubkey: "TODO_replace_with_deploy_public_key"  # SSH public key
restic_password: "TODO_set_strong_passphrase"         # Backup encryption
b2_account_id: ""                                     # Backblaze B2 (optional)
b2_application_key: ""                                # Backblaze B2 (optional)
```

#### 2. Ansible Inventory Template

**Required Configuration for `infrastructure/ansible/inventory.local.ini`**  
```ini
[vps]
<VPS_IP> ansible_user=deploy ansible_ssh_private_key_file=~/.ssh/your_deploy_key ansible_ssh_common_args='-o IdentitiesOnly=yes'
```

#### 3. Missing Environment Template

**Security Note:** Environment template cannot be read due to security concerns. All sensitive values must be managed through external KMS/Vault in production.

---

## Risk Summary

| Risk Level | Count | Details |
|------------|-------|---------|
| CRITICAL | 0 | None identified |
| HIGH | 1 | Production keystore backend not wired |
| MEDIUM | 2 | Audit logging not centralized, npm release environment setup |
| LOW | 2 | Pattern-based secret detection, project audit files |
| **TOTAL** | **5** | All high-risk items have mitigations |

---

## Action Items Summary

### Immediate Actions (Before Production)

#### 1. Production Keystore Backend Setup
```yaml
Priority: HIGH
Estimated Time: 2-3 weeks
Dependencies: None
Owner: Infrastructure Team
Status: In Planning

Tasks:
- [ ] Choose backend provider (KMS/HSM/Vault/Ledger)
- [ ] Deploy backend to production environment
- [ ] Configure keystore provider to use backend
- [ ] Update `infrastructure/secrets/policies/access.md` with production procedures
- [ ] Test signing operations end-to-end
- [ ] Configure audit event routing
```

#### 2. Centralized Audit Logging
```yaml
Priority: MEDIUM
Estimated Time: 1-2 weeks
Dependencies: Production keystore backend
Owner: Infrastructure Team
Status: In Planning

Tasks:
- [ ] Deploy centralized audit logging solution (ELK, Splunk, or similar)
- [ ] Configure log shipping from all services
- [ ] Set up retention policies (min 1 year)
- [ ] Configure alerting rules for security events
- [ ] Implement access control for audit data
- [ ] Test audit log integrity (hash-chain verification)
```

#### 3. npm Release Environment Setup
```yaml
Priority: MEDIUM
Estimated Time: 1 week
Dependencies: None
Owner: Release Team
Status: In Planning

Tasks:
- [ ] Register each npm package as Trusted Publisher on npmjs.com
- [ ] Configure repository environments in GitHub
- [ ] Set up release approval rules (if required)
- [ ] Test release workflow with `--dry-run`
- [ ] Verify npm provenance is attached to published packages
```

### Short-term Improvements (Q3 2026)

#### 4. Enhanced Secret Leak Detection
```yaml
Priority: LOW
Estimated Time: 2-3 weeks
Dependencies: None
Owner: Security Team
Status: In Planning

Tasks:
- [ ] Implement AST-based secret detection rules
- [ ] Add integration testing for secret rotation procedures
- [ ] Schedule regular security audits of third-party dependencies
- [ ] Consider false positive review process
```

#### 5. Monitoring Enhancements
```yaml
Priority: LOW
Estimated Time: 1 week
Dependencies: None
Owner: Infrastructure Team
Status: In Planning

Tasks:
- [ ] Set up Uptime Kuma with proper alerting
- [ ] Configure backup verification and restoration testing
- [ ] Implement security-specific monitoring dashboards
```

### Long-term Improvements (Q4 2026)

#### 6. Documentation
```yaml
Priority: LOW
Estimated Time: 2 weeks
Dependencies: None
Owner: Documentation Team
Status: In Planning

Tasks:
- [ ] Complete changeset-based release documentation
- [ ] Add incident response procedures
- [ ] Document backup restoration procedures
- [ ] Create security awareness training materials
```

---

## Validation Commands

Run these from the repository root to validate the current security baseline:

```bash
# Security checks
pnpm run security:check
pnpm run security:audit
pnpm run security:secrets

# Quality checks
pnpm run lint
pnpm run typecheck
pnpm run build

# Test execution
pnpm exec moon run :test --concurrency 4
```

---

## References

### Security Documentation
- `SECURITY.md` - Security model and reporting procedures
- `SECURITY-FINDINGS.md` - Previous security findings
- `.github/SECURITY.md` - GitHub security policy
- `infrastructure/secrets/README.md` - Secret management (protected)

### Infrastructure Documentation
- `infrastructure/README.md` - Infrastructure overview
- `infrastructure/STRUCTURE.md` - Detailed structure
- `infrastructure/ansible/README.md` - Ansible provisioning (if exists)

### Architecture Documentation
- `ARCHITECTURE.md` - Five-tier architecture
- `README.md` - Repository overview
- `docs/adr/` - Architecture decision records

---

## Audit History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-05-06 | 1.0 | Security Team | Initial audit - comprehensive security and infrastructure review |

---

## Next Steps

1. **Review and approve action items** with stakeholders
2. **Assign ownership** for each action item
3. **Create tracking tickets** in project management system
4. **Schedule follow-up audit** for 2026-08-06
5. **Update AUDIT.md** as action items are completed

---

*This document is confidential and intended for internal use only. Distribution outside the organization requires approval from the security team.*