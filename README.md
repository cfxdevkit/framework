# root/ — Unified Codebase Scaffolding (Phase 1)

> **Phase 1 deliverable:** high-level folder system + scope definitions only.
> No code, no migration, no implementation. Each component will be reviewed in detail in Phase 2.

This directory proposes a single, unified layout that absorbs and reorganises the
six existing top-level repositories (`cas/`, `chainbrawler/`, `conflux-phaser/`,
`devkit/`, `devkit-workspace/`, `Electro/`) into a coherent, layered, modular
architecture.

The end goal:

- **Maintainability** — one set of conventions, one build pipeline, one lint config.
- **Security** — explicit boundaries between published code, private tooling, secrets, and user-facing apps.
- **Reusability** — `devkit` becomes the framework backbone consumed by every project.
- **Expandability** — a clear "where does new code go?" answer for any contributor.

---

## Five-tier architecture

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

---

## Tier summary

| Tier | Folder | Role | Published? |
|------|--------|------|------------|
| 0 | [framework/](framework/) | Chain SDK, contracts, React primitives | ✅ npm `@cfxdevkit/*` |
| 1 | [platform/](platform/) | Devcontainer, AI agent tools, scaffolding | ⚠️ Some (CLI, MCP) |
| 2 | [domains/](domains/) | Game engine, automation, hardware bridges | ⚠️ Optional |
| 3 | [projects/](projects/) | End-user applications | ❌ Internal/deployed |
| — | [infrastructure/](infrastructure/) | Docker, K8s, CI, monitoring | ❌ |
| — | [tools/](tools/) | Shared configs, codegen, release scripts | ❌ |
| — | [docs/](docs/) | All long-form documentation | ❌ |

---

## Source repository → new home

| Existing repo | Destination |
|---------------|-------------|
| `devkit/packages/*` | `framework/*` |
| `devkit/devtools/*` | `platform/devtools/*` |
| `devkit-workspace/packages/mcp-server` | `platform/mcp-server/` |
| `devkit-workspace/packages/scaffold-cli` | `platform/scaffold-cli/` |
| `devkit-workspace/packages/vscode-extension` | `platform/vscode-extension/` |
| `devkit-workspace/templates/*` | `platform/templates/*` |
| `devkit-workspace/.devcontainer` | `platform/devcontainer/` |
| `chainbrawler/packages/core` | `domains/game-engine/` (extracted, generalised) |
| `cas/conflux-cas/worker` (patterns) | `domains/automation/` (extracted) |
| `Electro/packages/{ws-protocol,sensor-types,hardware-diagram}` | `domains/hardware-bridge/` |
| `cas/*` | `projects/cas/` |
| `chainbrawler/*` | `projects/chainbrawler/` |
| `conflux-phaser/*` | `projects/conflux-phaser/` |
| `Electro/*` | `projects/electro/` |

Detailed mapping & sequencing live in [MIGRATION.md](MIGRATION.md).

---

## Documents in this folder

- [ARCHITECTURE.md](ARCHITECTURE.md) — design rationale, dependency rules, boundary contracts.
- [MIGRATION.md](MIGRATION.md) — phase-2 plan: how to move existing code without breaking consumers.
- [CONTRIBUTING.md](CONTRIBUTING.md) — workflow, tier ownership, PR conventions.
- [SECURITY.md](SECURITY.md) — secrets, key handling, supply-chain, threat model surface per tier.

---

## Status

| Phase | Scope | State |
|-------|-------|-------|
| **1** | Folder scaffolding + scope docs (this PR) | ✅ in progress |
| 2 | Per-component detailed design review | ⏳ pending |
| 3 | Incremental migration of code | ⏳ pending |
| 4 | Decommission old top-level repos | ⏳ pending |
