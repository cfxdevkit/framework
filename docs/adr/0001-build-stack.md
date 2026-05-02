# ADR-0001 — Build & Workspace Stack

- **Status:** Accepted (Phase 1)
- **Date:** 2026-04-28
- **Supersedes:** existing per-repo Turbo + ad-hoc Vite configs

## Context

The legacy repos use a mix of Turborepo (`devkit/`, `chainbrawler/`), pnpm-only orchestration (`devkit-workspace/`, `cas/`, `Electro/`), and a stand-alone Vite app (`conflux-phaser/`). We want one unified stack that:

- runs and deploys **anywhere** (no Vercel coupling),
- works **offline**,
- has **no SaaS account** in the critical path,
- handles libraries, web apps, Node services, and a small C++ corner (firmware),
- stays approachable for new contributors.

## Decision

| Concern | Choice |
|---------|--------|
| Package manager | **pnpm 10+** workspaces |
| Bundler (libs + apps) | **Vite 8** (Rolldown). Libraries with `vite build --lib` + `vite-plugin-dts`. |
| Task runner / cache | **moonrepo** (Rust, vendor-neutral). Local cache by default; pluggable S3-compatible remote cache. |
| Linter / formatter | **Biome** |
| Tests | **Vitest** (unit/integration), **Playwright** (e2e), **Hardhat** (contracts) |
| Type-check orchestration | TS project references driven by moon |
| Releases | **Changesets** in `framework/`; tags + GitOps in `projects/` |
| Firmware build | **PlatformIO** (kept in `projects/electro/apps/firmware`), invoked through a moon task |

## Consequences

**Positive**
- Static output deploys to any object storage / nginx / Cloudflare Pages / Netlify.
- No Vercel / Nx Cloud lock-in.
- Same `vite.config.ts` style across libraries and apps.
- moon's integrated toolchain pins Node + pnpm versions for reproducibility.

**Negative**
- moon is less widespread than Turbo; contributors need a short onboarding doc (`docs/guides/moon-quickstart.md`).
- Migration of existing Turbo pipelines needs a one-time rewrite (covered in MIGRATION.md step 1).

## Rejected alternatives

- **Turborepo** — increasing Vercel coupling, paid Remote Cache.
- **Nx** — heavy, pushes Nx Cloud, opinionated generators we don't need.
- **Bazel** — overkill for a JS/TS-first stack.
- **Rush** — strong but Microsoft-centric tooling and learning curve outweigh the gain.
- **tsup / unbuild for libs** — Vite lib-mode now matches feature-wise and removes a tool.
