# root/ — Modular Monorepo Workspace

This repository is the active workspace for the modularized `@cfxdevkit/*`
stack. The codebase already runs as a single pnpm + Moon monorepo, but its
packages are grouped into `repos/cfx-*` slices so responsibilities are separated
before the final carve-out into standalone repositories.

The current goal:

- **Maintainability** — one set of conventions, one build pipeline, one lint config.
- **Security** — explicit boundaries between published code, private tooling, secrets, and user-facing apps.
- **Reusability** — shared packages are grouped by technical surface and reused by projects.
- **Expandability** — contributors and agents can tell where new code belongs today.

## Current workspace layout

The present-day repository shape is:

```
root/
├── repos/            Modular package slices used today
│   ├── cfx-core/     Chain/runtime primitives
│   ├── cfx-keys/     Signing, keystore, hardware trust boundary
│   ├── cfx-ui/       React, theme, wallet-connect UI packages
│   ├── cfx-domain/   Reusable vertical domain packages
│   ├── cfx-tools/    CLI, MCP, scaffolding, editor/dev tooling
│   └── cfx-solidity/ Solidity-oriented packages that are still grouped separately
├── projects/         Deployable and example applications
├── infrastructure/   Deployment and operational assets
├── .devcontainer/    Root development container for the active monorepo
├── tools/            Shared workspace tooling/config
└── docs/             Architecture, ADRs, and long-form docs
```

This is the structure agents should follow when deciding where to place code.
The `repos/cfx-*` directories are the current source of truth for package
ownership. The five-tier `framework/` / `platform/` / `domains/` model below is
the architectural target that explains the intended boundaries those slices map
to.

---

## Target architecture

The long-term topology remains the five-tier architecture described in
[ARCHITECTURE.md](ARCHITECTURE.md) and [MIGRATION.md](MIGRATION.md). It is a
planning model, not the literal top-level folder structure that exists today.

```
root/
├── framework/        Tier 0 — Reusable SDK published to npm (@cfxdevkit/*)
├── platform/         Tier 1 — Developer platform (devcontainer, MCP, CLI, IDE)
├── domains/          Tier 2 — Reusable vertical domain libraries (game, automation, hardware)
├── projects/         Tier 3 — Consumer applications (cas, chainbrawler, electro, …)
├── infrastructure/   Cross-cutting — Deployment, CI/CD, observability
├── tools/            Cross-cutting — Shared dev tooling (configs, codegen, release)
└── docs/             Cross-cutting — Architecture, ADRs, guides, API reference
```

**Dependency rule (one-way only):**

```
projects ─▶ domains ─▶ platform ─▶ framework
            └────────────────────────▶ framework
infrastructure & tools & docs may be referenced by any tier.
```

A lower tier may **never** import from a higher tier.

## Current slice-to-tier mapping

Use this mapping when working in the current repository:

| Current slice | Intended tier | Responsibility today |
|---------------|---------------|----------------------|
| `repos/cfx-core` | Tier 0 | core, protocol, executor, devnode, testing |
| `repos/cfx-keys` | Tier 0 | keystore, wallet, hardware signing surface |
| `repos/cfx-ui` | Tier 0 | React-facing and UI packages |
| `repos/cfx-solidity` | Tier 0 | contracts, compiler, ABI extraction |
| `repos/cfx-tools` | Tier 1 | CLI, MCP, scaffolding, editor/dev tooling |
| `repos/cfx-domain` | Tier 2 | reusable domain packages |
| `projects/*` | Tier 3 | apps, examples, and project-local packages |
| `tools/*`, `docs/*`, `infrastructure/*` | Cross-cutting | workspace support |

---

## Tier summary

| Tier | Folder | Role | Published? |
|------|--------|------|------------|
| 0 | `repos/cfx-{core,keys,ui,solidity}` today; `framework/` target | Chain SDK, contracts, React primitives | ✅ npm `@cfxdevkit/*` |
| 1 | `repos/cfx-tools` today; `platform/` target | Devcontainer, AI agent tools, scaffolding | ⚠️ Some (CLI, MCP) |
| 2 | `repos/cfx-domain` today; `domains/` target | Game engine, automation, hardware bridges | ⚠️ Optional |
| 3 | [projects/](projects/) | End-user applications | ❌ Internal/deployed |
| — | [infrastructure/](infrastructure/) | Docker, K8s, CI, monitoring | ❌ |
| — | [tools/](tools/) | Shared configs, codegen, release scripts | ❌ |
| — | [docs/](docs/) | All long-form documentation | ❌ |

---

## Legacy source repository → current home

| Existing repo | Destination |
|---------------|-------------|
| `devkit/packages/*` | `repos/cfx-{core,keys,ui,solidity}/packages/*` |
| `devkit/devtools/*` | `repos/cfx-tools/devtools/*` |
| `devkit-workspace/packages/mcp-server` | `repos/cfx-tools/packages/mcp-server` |
| `devkit-workspace/packages/scaffold-cli` | `repos/cfx-tools/packages/scaffold-cli` |
| `devkit-workspace/packages/vscode-extension` | `repos/cfx-tools/packages/vscode-extension` |
| `devkit-workspace/templates/*` | `repos/cfx-tools/templates/*` |
| `devkit-workspace/.devcontainer` | `repos/cfx-tools/devcontainer/*` |
| `chainbrawler/packages/core` | `repos/cfx-domain/packages/game-engine` |
| `cas/conflux-cas/worker` (patterns) | `repos/cfx-domain/packages/automation` |
| `Electro/packages/{ws-protocol,sensor-types,hardware-diagram}` | `repos/cfx-domain/packages/hardware-bridge` |
| `cas/*` | `projects/cas/` |
| `chainbrawler/*` | `projects/chainbrawler/` |
| `conflux-phaser/*` | `projects/conflux-phaser/` |
| `Electro/*` | `projects/electro/` |

Detailed mapping and planned end-state sequencing live in [MIGRATION.md](MIGRATION.md).

---

## Documents in this folder

- [ARCHITECTURE.md](ARCHITECTURE.md) — design rationale, dependency rules, boundary contracts.
- [MIGRATION.md](MIGRATION.md) — phase-2 plan: how to move existing code without breaking consumers.
- [CONTRIBUTING.md](CONTRIBUTING.md) — workflow, tier ownership, PR conventions.
- [SECURITY.md](SECURITY.md) — secrets, key handling, supply-chain, threat model surface per tier.
- [.devcontainer/README.md](.devcontainer/README.md) — root devcontainer setup for the monorepo toolchain.
- [docs/llm-fine-tuning-plan.md](docs/llm-fine-tuning-plan.md) — planning notes for repository-centered LLM automation, local inference, datasets, evals, and fine-tuning.

---

## Status

| Phase | Scope | State |
|-------|-------|-------|
| **Current** | Modular monorepo under `repos/cfx-*` + `projects/*` | ✅ active |
| Next | Documentation alignment for current structure | 🚧 in progress |
| Future | Final tier-shaped carve-out / repo split | ⏳ planned |
