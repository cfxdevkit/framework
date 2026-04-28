# infrastructure — Detailed Structure

```
infrastructure/
├── README.md
│
├── docker/                         ── Reusable images & compose stacks ──
│   ├── README.md
│   ├── base-node/                  base Node 20 image with pnpm + moon
│   │   └── Dockerfile
│   ├── conflux-node/               local Conflux node image (used by devcontainer)
│   │   ├── Dockerfile
│   │   └── entrypoint.sh
│   ├── postgres/                   tuned Postgres for backend services
│   │   └── Dockerfile
│   └── nginx-static/               static-site server (used by all frontends)
│       ├── Dockerfile
│       └── nginx.conf
│
├── ci/                             ── Reusable workflows ──
│   ├── README.md
│   ├── workflows/                  GitHub Actions reusable workflows
│   │   ├── lint.yml
│   │   ├── typecheck.yml
│   │   ├── test.yml
│   │   ├── build.yml
│   │   ├── publish-framework.yml   changesets-driven npm publish
│   │   ├── deploy-static.yml
│   │   └── deploy-image.yml
│   ├── actions/                    composite actions
│   │   ├── setup-pnpm/
│   │   ├── setup-moon/
│   │   └── moon-cache/             remote cache via S3-compatible bucket
│   └── policies/
│       ├── codeowners.md
│       └── branch-protection.md
│
├── monitoring/                     ── Observability stack ──
│   ├── README.md
│   ├── prometheus/
│   │   ├── prometheus.yml
│   │   └── rules/
│   │       └── alerts.yml
│   ├── grafana/
│   │   ├── dashboards/
│   │   │   ├── framework-rpc.json
│   │   │   ├── executor.json
│   │   │   └── electro.json
│   │   └── datasources/
│   ├── loki/
│   │   └── config.yml
│   └── otel-collector/
│       └── config.yml
│
├── secrets/                        ── Templates & references ONLY ──
│   ├── README.md                   how secrets are sourced (KMS / Vault / OIDC)
│   ├── .sops.yaml                  SOPS recipients per environment
│   ├── env.template
│   └── policies/
│       ├── rotation.md
│       └── access.md
│
├── cas/                            ── Per-project deploy artefacts ──
│   ├── README.md
│   ├── docker-compose.prod.yml
│   ├── k8s/
│   │   ├── frontend.yaml
│   │   ├── backend.yaml
│   │   ├── worker.yaml
│   │   └── ingress.yaml
│   └── runbooks/
│       ├── incident.md
│       └── deploy.md
│
├── chainbrawler/
│   ├── README.md
│   └── deploy/
│       └── static-deploy.md
│
├── conflux-phaser/
│   ├── README.md
│   └── deploy/
│
└── electro/
    ├── README.md
    ├── docker-compose.yml          backend
    └── ota/
        └── README.md               firmware OTA deploy notes
```

### Rules

- **No real secrets** in this folder. Only references and SOPS-encrypted files (key in KMS).
- Per-project subfolders mirror `projects/` names exactly.
- Reusable building blocks live under `docker/`, `ci/`, `monitoring/`, `secrets/`.
