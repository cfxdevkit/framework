# docs/  — Long-form documentation

Per-package READMEs stay co-located with their packages. This folder hosts
material that spans multiple packages or tiers.

## Structure

```
docs/
├── architecture/       Diagrams, deep-dives, design notes
├── adr/                Architectural Decision Records (one MD per decision)
├── guides/             How-tos: getting started, deploying, integrating wallet, …
├── api/                Generated API reference (TypeDoc output)
├── projects/           Per-project documentation entry points
└── security/           Threat models, audit history, key handling guides
```

## Rules

- ADRs are append-only; superseded ADRs link forward to their replacement.
- Generated API docs are produced by CI; the source-of-truth is JSDoc/TSDoc in code.
- The public docs site (`platform/docs-site/`) builds from this folder.

## Operational guides

- [keystore-docker.md](keystore-docker.md) — Run a hardened local
  encrypted keystore inside Docker (single-container and sidecar patterns).
