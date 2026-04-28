# infrastructure/  — Deployment, CI/CD, Observability

Cross-cutting operational concerns. Code here references projects but project code
does **not** import from here.

## Structure

```
infrastructure/
├── docker/               Reusable Dockerfiles + compose stacks
├── k8s/                  Kubernetes manifests / Helm charts (per project)
├── ci/                   Reusable GitHub Actions / workflow templates
├── monitoring/           Prometheus, Grafana, alert rules
├── secrets/              Pointers/templates only — NEVER actual secrets
└── <project>/            Per-project deploy artifacts (cas/, chainbrawler/, electro/, …)
```

## Rules

- Secrets are stored in a secret manager; this folder may only contain templates and references.
- Per-project subfolders mirror the names in `projects/`.
- CI workflow files at `.github/workflows/` reference reusable bits from `ci/`.
