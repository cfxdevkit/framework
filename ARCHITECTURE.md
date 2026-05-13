# Architecture

This document describes the architectural rules that govern the current
workspace. The repository is physically organized as `repos/cfx-*` slices plus
`projects/*`, but those slices map onto the tier model below.

The machine-readable source of truth for tier paths, lifecycle state, and
validation rules is `repos/cfx-meta/arch-rules.yaml`. Keep this document aligned
with that file; validation tooling should consume `@cfxdevkit/arch-rules` rather
than parsing prose from this document.

## Current operating model

Agents and contributors should treat the current workspace like this:

| Current path | Architectural role | Conceptual tier name |
|---|---|---|
| `repos/cfx-meta`, `repos/cfx-config` | Cross-cutting architecture/config packages | `cross-cutting/` |
| `repos/cfx-core`, `repos/cfx-keys`, `repos/cfx-ui`, `repos/cfx-solidity` | Tier 0 reusable packages | `framework/` |
| `repos/cfx-tools` | Tier 1 developer platform | `platform/` |
| `repos/cfx-domain` | Tier 2 reusable domains | `domains/` |
| `projects/*` | Tier 3 applications and project-local code | `projects/` |
| `docs/*`, `infrastructure/*` | Cross-cutting support | (literal paths) |

> **Note for documentation tooling:** When this document uses `framework/`, `platform/`,
> or `domains/` as shorthand tier names, those are **conceptual labels only** — the actual
> file paths on disk follow the `repos/cfx-*` layout above. Do **not** generate file paths
> using the shorthand tier names; use the real `repos/cfx-*/packages/` paths instead.

When this document says `framework/`, `platform/`, or `domains/`, read those as
architectural tiers first, not as mandatory literal folder names in the current
repository.

## Goals

1. **One-way dependency graph.** Tiers cannot create cycles.
2. **Replaceable consumers.** A project can be removed without affecting framework or other projects.
3. **Stable public surface.** Anything inside `framework/` honours semver and is published to npm.
4. **Explicit private boundary.** Anything inside `platform/devtools/` or `projects/` is internal and may break freely.
5. **Domain extraction by demand.** Logic moves from `projects/` → `domains/` → `framework/` as it proves reusable across ≥ 2 projects.

## Layered model

Conceptual target:

```
┌─────────────────────────────────────────────────────────────┐
│  projects/      cas │ chainbrawler │ conflux-phaser │ electro│  Tier 3
├─────────────────────────────────────────────────────────────┤
│  domains/      game-engine │ automation │ hardware-bridge   │  Tier 2
├─────────────────────────────────────────────────────────────┤
│  platform/     devcontainer │ mcp │ scaffold │ vscode-ext   │  Tier 1
├─────────────────────────────────────────────────────────────┤
│  framework/    core │ react │ wallet-connect │ contracts …  │  Tier 0
├─────────────────────────────────────────────────────────────┤
│  cross-cutting meta │ config                                │  Tier -1
└─────────────────────────────────────────────────────────────┘
                ▲          ▲           ▲          ▲
                │          │           │          │
         cfx-config/ infrastructure/  docs/   (cross-cutting)
```

Current implementation:

```
┌─────────────────────────────────────────────────────────────┐
│  projects/      apps, examples, project-local packages      │  Tier 3
├─────────────────────────────────────────────────────────────┤
│  repos/cfx-domain  game-engine │ automation │ hardware      │  Tier 2
├─────────────────────────────────────────────────────────────┤
│  repos/cfx-tools   mcp │ scaffold │ cli │ editor tooling   │  Tier 1
├─────────────────────────────────────────────────────────────┤
│  repos/cfx-*       core │ keys │ ui │ solidity             │  Tier 0
├─────────────────────────────────────────────────────────────┤
│  repos/cfx-meta │ repos/cfx-config                         │  Tier -1
└─────────────────────────────────────────────────────────────┘
                ▲          ▲           ▲          ▲
                │          │           │          │
         cfx-config/ infrastructure/  docs/   (cross-cutting)
```

## Boundary contracts

### cross-cutting/  (Tier -1)
- Owns architecture metadata, docs orchestration, and build configuration.
- May be consumed as `devDependencies` by any tier.
- **MUST NOT** be a runtime dependency of framework, platform, domain, or project packages.
- **Current location:** `repos/cfx-meta`, `repos/cfx-config`.

### framework/  (Tier 0)
- **MUST** be tree-shakeable, side-effect free where possible.
- **MUST** target Node 20+ and modern browsers; no Node-only APIs in browser-targeted packages.
- **MUST NOT** depend on any other tier.
- **MUST** publish typed entrypoints + sourcemaps + LICENSE.
- **Current location:** `repos/cfx-core`, `repos/cfx-keys`, `repos/cfx-ui`, `repos/cfx-solidity`.

### platform/  (Tier 1)
- May depend on `framework/` via npm range, never via workspace `*` (so platform can ship independent of framework HEAD).
- Owns developer experience: containers, AI agent tooling, scaffolding, IDE integration.
- Is **never** a runtime dependency of a deployed application.
- **Current location:** `repos/cfx-tools`.

### domains/  (Tier 2)
- Encapsulates one vertical concern (game state, automation strategy, hardware protocol).
- Imports `framework/` only.
- Each domain package documents its public API in its own README.
- Promotion criterion: used by ≥ 2 projects, or explicitly designated as a future product.
- **Current location:** `repos/cfx-domain`.

### projects/  (Tier 3)
- Free to be opinionated; may use any framework/domain/platform package.
- Each project has its own deploy lifecycle (`infrastructure/<project>`).
- Project-internal `packages/` directories are allowed for code that is genuinely project-specific.

### infrastructure/
- Holds Dockerfiles, compose files, K8s manifests, Terraform, CI workflows, observability dashboards.
- Code references project names but project code does not import from here.

### tools/
- Shared `tsconfig`, `biome`, `eslint`, codegen, release automation.
- Versioned alongside framework but consumed by every workspace package.

### docs/
- Long-form documentation (architecture, ADRs, guides, generated API).
- Per-package READMEs stay co-located inside their package.

## Workspace & build

Decision recorded in [docs/adr/0001-build-stack.md](docs/adr/0001-build-stack.md).

- **Package manager:** **pnpm workspaces**, single root lockfile, `workspace:*` protocol.
- **Bundler (libs and apps):** **Vite 7** (Rolldown). Libraries use `vite build --lib` + `vite-plugin-dts`. Apps use plain `vite build` and emit static assets that deploy on any static host (S3, Cloudflare Pages, Netlify, nginx, plain Docker — no Vercel coupling).
- **Task runner / cache:** **moonrepo** (Rust, vendor-neutral, no cloud lock-in). Replaces Turborepo to remove the Vercel dependency. Local cache by default; remote cache is pluggable to any S3-compatible bucket.
- **Linter / formatter:** **Biome** (already standard across the existing repos).
- **Testing:** **Vitest** (unit + integration), **Playwright** (e2e where needed), **Hardhat** (contracts), **framework/testing** package for shared fixtures.
- **Type-checking:** project-references TypeScript driven by moon's task graph.
- **Releases:** **Changesets** in `framework/`; per-project tags + GitOps in `projects/`.

In the current workspace, Moon projects are declared directly from the `repos/*/packages/*`,
`projects/*/*`, and `tools/*` paths. The architectural rules apply to those
concrete paths.

### Why not Turborepo / Nx / Bazel?
- **Turborepo** has tightened Vercel coupling (Remote Cache hosted on Vercel by default, growing telemetry surface). We want every part of the stack runnable offline and in any cloud.
- **Nx** is excellent but pushes Nx Cloud and is heavier than what we need.
- **Bazel** is overkill for a JS/TS-first stack with one C++ corner.
- **moon** gives us deterministic hashing, parallel task graph, integrated toolchain, and remote-cache-as-a-bucket — all without a vendor account.

## Security boundaries (summary — see SECURITY.md)

| Concern | Located in | Notes |
|--------|-----------|-------|
| Private keys / keystores | never committed | env + `infrastructure/secrets/` references only |
| Smart-contract source | `projects/<p>/contracts/` | each project owns its deployments |
| Generated ABIs | `framework/contracts/` (shared) or per-project | published, versioned |
| Network endpoints | `framework/core` config or per-project env | no hard-coded mainnet keys |
| MCP / AI tool surface | `platform/mcp-server/` | explicit tool allowlist |
