# Architecture

## Goals

1. **One-way dependency graph.** Tiers cannot create cycles.
2. **Replaceable consumers.** A project can be removed without affecting framework or other projects.
3. **Stable public surface.** Anything inside `framework/` honours semver and is published to npm.
4. **Explicit private boundary.** Anything inside `platform/devtools/` or `projects/` is internal and may break freely.
5. **Domain extraction by demand.** Logic moves from `projects/` → `domains/` → `framework/` as it proves reusable across ≥ 2 projects.

## Layered model

```
┌─────────────────────────────────────────────────────────────┐
│  projects/      cas │ chainbrawler │ conflux-phaser │ electro│  Tier 3
├─────────────────────────────────────────────────────────────┤
│  domains/      game-engine │ automation │ hardware-bridge   │  Tier 2
├─────────────────────────────────────────────────────────────┤
│  platform/     devcontainer │ mcp │ scaffold │ vscode-ext   │  Tier 1
├─────────────────────────────────────────────────────────────┤
│  framework/    core │ react │ wallet-connect │ contracts …  │  Tier 0
└─────────────────────────────────────────────────────────────┘
                ▲          ▲           ▲          ▲
                │          │           │          │
            tools/   infrastructure/  docs/   (cross-cutting)
```

## Boundary contracts

### framework/  (Tier 0)
- **MUST** be tree-shakeable, side-effect free where possible.
- **MUST** target Node 20+ and modern browsers; no Node-only APIs in browser-targeted packages.
- **MUST NOT** depend on any other tier.
- **MUST** publish typed entrypoints + sourcemaps + LICENSE.

### platform/  (Tier 1)
- May depend on `framework/` via npm range, never via workspace `*` (so platform can ship independent of framework HEAD).
- Owns developer experience: containers, AI agent tooling, scaffolding, IDE integration.
- Is **never** a runtime dependency of a deployed application.

### domains/  (Tier 2)
- Encapsulates one vertical concern (game state, automation strategy, hardware protocol).
- Imports `framework/` only.
- Each domain package documents its public API in its own README.
- Promotion criterion: used by ≥ 2 projects, or explicitly designated as a future product.

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
