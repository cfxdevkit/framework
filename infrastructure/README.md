# infrastructure/  — Deployment, CI/CD, Observability

Cross-cutting operational concerns. Code here references projects but project code
does **not** import from here.

## Structure

```
infrastructure/
├── README.md
├── STRUCTURE.md
└── secrets/              Policies and templates only — NEVER actual secrets
```

## Rules

- Secrets are stored in a secret manager; this folder may only contain templates and references.
- Production signing and deploy secrets must follow [secrets/](secrets/).
- CI workflow files currently live directly in `.github/workflows/`.
