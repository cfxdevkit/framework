# docs — Detailed Structure (target layout)

Workspace path: `docs`

This file describes the intended shape of the documentation set. It is a target
map, not a guarantee that every directory below already exists.

## Current state (implemented today)

At the moment the repository contains:

```
docs/
├── README.md
├── STRUCTURE.md
├── architecture/
├── adr/
├── keystore-docker.md
└── llm-fine-tuning-plan.md
```

Agents should treat the missing sections below as planned documentation work,
not as evidence that the repository structure is wrong.

## Target state (planned structure)

```
docs/
├── README.md
│
├── architecture/                   ── Cross-cutting design docs ──
│   ├── README.md
│   ├── overview.md                 5-tier overview + dependency graph diagram
│   ├── package-layout.md           standard package shape (already created)
│   ├── keystore-session-provider.md centralized wallet/session control plane
│   ├── tier-rules.md               what may import what
│   ├── boundaries.md               public API rules per tier
│   ├── data-flow.md                project ↔ chain ↔ keeper ↔ MCP
│   └── diagrams/                   .mmd / .drawio source files
│       ├── tiers.mmd
│       └── keystore-backends.mmd
│
├── adr/                            ── Architectural Decision Records ──
│   ├── README.md                   index + ADR template
│   ├── 0001-build-stack.md         (created)
│   ├── 0002-keystore.md            (created)
│   ├── 0003-multi-repo-split.md           (accepted)
│   ├── 0004-vite-everywhere.md           (placeholder)
│   ├── 0005-session-keys-default.md      (placeholder)
│   ├── 0006-mcp-tool-allowlist.md        (placeholder)
│   └── _template.md
│
├── guides/                         ── How-to guides ──
│   ├── README.md
│   ├── getting-started.md
│   ├── moon-quickstart.md          for contributors used to Turbo
│   ├── using-the-devcontainer.md
│   ├── llm-automation.md           implementation guide once the plan is approved
│   ├── keystore-setup.md           per-environment setup
│   ├── publishing-a-framework-package.md
│   ├── adding-a-new-project.md
│   ├── adding-a-new-domain.md
│   ├── deploying-a-static-app.md
│   ├── deploying-a-node-service.md
│   ├── writing-an-mcp-tool.md
│   └── ota-firmware-update.md
│
├── api/                            ── Generated API reference (TypeDoc output) ──
│   ├── README.md                   regen instructions
│   ├── framework/                  one folder per framework package (generated)
│   ├── platform/
│   └── domains/
│
├── projects/                       ── Per-project entry points ──
│   ├── README.md
│   ├── cas.md
│   ├── chainbrawler.md
│   ├── conflux-phaser.md
│   └── electro.md
│
├── security/                       ── Security material ──
│   ├── README.md
│   ├── threat-model.md             system-wide STRIDE
│   ├── key-handling.md             expanded ADR-0002
│   ├── audit-history.md            links to project-level security and review records
│   ├── disclosure.md               coordinated disclosure policy
│   └── supply-chain.md             provenance, lockfile, sbom
│
└── reference/                      ── Misc reference material ──
    ├── glossary.md
    ├── chains.md                   chain ids, RPC endpoints, explorers
    └── deployments.md              canonical contract addresses
```

### Build

The site at `platform/docs-site/` consumes this folder verbatim. Local preview:
`pnpm --filter @cfxdevkit/docs-site dev`. Output is plain static HTML.
