# docs/  — Long-form documentation

Per-package READMEs stay co-located with their packages. This folder hosts
material that spans multiple packages or tiers.

This folder documents both the current modularized workspace and the planned
future topology. Unless a document explicitly says otherwise, prefer the current
`repos/cfx-*` and `projects/*` layout when following setup instructions.

## Current structure

Implemented today:

```
docs/
├── architecture/       Cross-cutting design notes and package-shape guidance
├── adr/                Architectural Decision Records
├── README.md
├── STRUCTURE.md
├── keystore-docker.md  Operational guide
└── llm-fine-tuning-plan.md  Planning guide
```

## Planned structure

Target layout after the docs site and supporting sections are filled in:

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
- Some sections shown above are planned and may not exist yet.
- If current code structure and a planned docs example diverge, follow the current workspace structure described in the root README and architecture docs.
- The public docs site consumes this folder once the docs-site package is wired into the modularized workspace.

## Operational guides

- [keystore-docker.md](keystore-docker.md) — Run a hardened local
  encrypted keystore inside Docker (single-container and sidecar patterns).
- [architecture/keystore-session-provider.md](architecture/keystore-session-provider.md) —
  Centralized wallet selection, unlock, network alignment, and client reset
  design for sensitive keystore-backed sessions.
- [llm-fine-tuning-plan.md](llm-fine-tuning-plan.md) — Plan for generating
  repository-centered datasets and local coding-assistant fine-tuning artifacts.
