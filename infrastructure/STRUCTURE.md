# infrastructure — Detailed Structure

This file describes the current checked-in infrastructure files.

```
infrastructure/
├── README.md
├── STRUCTURE.md
└── secrets/                        ── Policies, templates, references ONLY ──
│   ├── README.md                   how secrets are sourced (KMS / Vault / OIDC)
│   ├── env.template
│   └── policies/
        ├── access.md
        ├── audit-retention.md
        ├── backup-recovery.md
│       ├── rotation.md
```

### Rules

- **No real secrets** in this folder. Only references and SOPS-encrypted files (key in KMS).
- Production secret rotation, recovery, access, and retention rules live under `secrets/policies/`.
- GitHub Actions workflows currently live under `.github/workflows/`.
