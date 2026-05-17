# ADR-0003 — Multi-Repo Split by Technical Surface

- **Status:** Proposed
- **Date:** 2026-04-29
- **Supersedes:** none
- **Related:** ADR-0001 (build stack), ADR-0002 (keystore)

## Context

The `root/` monorepo has crossed the size where a single `pnpm install`,
single `moon run :check`, and single release cycle become friction:

| Tier | Folder | Packages today | Surface |
|------|--------|----------------|---------|
| 0 | `framework/` | core, services, wallet, contracts, react, defi-react, theme, testing, devnode, executor, protocol, compiler, wallet-connect | Public, semver, npm-published |
| 1 | `platform/` | scaffold-cli, mcp-server, vscode-extension, devcontainer, devtools, docs-site, templates | Developer experience |
| 2 | `domains/` | game-engine, automation | Vertical concerns |
| 3 | `projects/` | cas, chainbrawler, conflux-phaser, electro | Deployable apps |
| — | `infrastructure/`, `docs/`, `tools/` | shared cross-cutting | — |

Symptoms of being too big:

- A change to a Phaser asset rebuilds 88 moon tasks even if Tier 0 is cold.
- Changesets for `framework/wallet` slip behind project releases that bumped
  in-tree dependencies.
- Contributors who only care about hardware (Electro/ESP32) clone gigabytes
  of game-engine + React + docs.
- AI-agent / MCP surfaces want their own release cadence (weekly) while
  smart-contracts want quarterly.
- Security review wants a *small* repo for keystore/signer code that can be
  audited in isolation.

## Decision

Split `root/` into **6 first-class repositories**, each responsible for
exactly one technical surface, plus the existing per-project repositories.
The split is **horizontal by tier** *and* **vertical by trust boundary**
inside Tier 0 — because keystore code has a strictly different blast radius
than UI code.

### Target topology

```
                    ┌─────────────────────────────────────────┐
                    │    cfx-meta  (this repo, slimmed down)  │
                    │  - ARCHITECTURE.md, ADRs, SECURITY.md   │
                    │  - workspace template & devcontainer    │
                    │  - release orchestration scripts        │
                    └─────────────────────────────────────────┘
                                       │ documents
            ┌──────────────┬───────────┼────────────┬──────────────┐
            ▼              ▼           ▼            ▼              ▼
    ┌─────────────┐ ┌────────────┐ ┌────────┐ ┌────────────┐ ┌──────────┐
    │ cfx-core    │ │ cfx-keys   │ │ cfx-ui │ │ cfx-domain │ │ cfx-tools│
    │             │ │            │ │        │ │            │ │          │
    │ Tier 0a     │ │ Tier 0b    │ │ Tier 0c│ │ Tier 2     │ │ Tier 1   │
    │ chain prims │ │ keystore + │ │ React  │ │ verticals  │ │ DX +     │
    │ + protocol  │ │ wallet +   │ │ + theme│ │            │ │ MCP +    │
    │             │ │ hardware + │ │ + defi │ │            │ │ scaffold │
    │             │ │ services   │ │ + WC   │ │            │ │ + ext    │
    └─────────────┘ └────────────┘ └────────┘ └────────────┘ └──────────┘
                          ▲                          ▲              ▲
                          │ npm                      │ npm          │ npm
                          └──── projects/* repos ────┴──────────────┘
                                (one repo per app)
```

### Repos

| # | Repo | Owns | Why standalone |
|---|------|------|----------------|
| 1 | `cfx-meta` | This repo, slimmed: ARCHITECTURE, ADRs, SECURITY, workspace template, release orchestration, cross-repo CI dispatch. | Single source of truth for architecture; tiny, no code. |
| 2 | `cfx-core` | `core`, `protocol`, `contracts`, `compiler`, `executor`, `devnode`, `testing` | Chain primitives; large surface but rarely changes; long support window. |
| 3 | **`cfx-keys`** | `services` (keystore interface + memory + file backends), `wallet` (signers, init, hardware, session-keys, policies), future `keystore-kms` / `keystore-os` / `keystore-forward` | **Audit-grade trust boundary.** Tightest review, separate threat model, separate release cadence. Smallest dep tree. |
| 4 | `cfx-ui` | `react`, `defi-react`, `theme`, `wallet-connect` | UI moves fastest; depends on `cfx-keys` + `cfx-core` over npm; no need to live next to chain code. |
| 5 | `cfx-domain` | `domains/game-engine`, `domains/automation` | Each vertical may eventually move to its own repo once reuse justifies the split. Start as one repo. |
| 6 | `cfx-tools` | `scaffold-cli`, `mcp-server`, `vscode-extension`, `devcontainer`, `devtools`, `docs-site`, `templates` | Developer experience releases on its own cadence (weekly), needs no semver discipline of Tier 0. |

Each `projects/<app>` (cas, chainbrawler, conflux-phaser, electro) keeps its
existing repo and consumes the published npm packages from `cfx-core`,
`cfx-keys`, `cfx-ui`, `cfx-domain`. **Projects do not depend on `cfx-tools`
at runtime.**

### Why `cfx-keys` is its own repo (not just a folder)

This is the central reason for the split, not a side-effect:

1. **Different threat model.** Anything that touches private keys gets
   external audit. Audit scope = "the repo" — keeping UI/protocol code out
   shrinks the audit by 10×.
2. **Different release cadence.** `cfx-keys` releases when crypto/security
   changes; `cfx-ui` releases weekly. Co-located, the slower repo blocks
   the faster one.
3. **Different commit access.** `cfx-keys` mainline merges require two
   reviewers, `signed-off-by`, and reproducible builds. `cfx-ui` does not.
4. **Different dependency surface.** `cfx-keys` depends only on
   `@noble/*`, `@scure/*`, `viem`, `cive`. No React, no Phaser, no
   Three.js. The lockfile is small and stable.
5. **Smaller blast radius for supply-chain attacks.** Compromise of a UI
   dep cannot reach signing code if signing code lives elsewhere.

## Detailed design

### Boundary contracts (unchanged from ARCHITECTURE.md)

The tier rules from ARCHITECTURE.md still apply, just enforced by repo
boundaries instead of folder boundaries:

- `cfx-core`: zero deps on other `cfx-*` repos.
- `cfx-keys`: depends on `@cfxdevkit/core` over npm range, never workspace.
- `cfx-ui`: depends on `@cfxdevkit/core` and `@cfxdevkit/wallet` over npm.
- `cfx-domain`: depends on `cfx-core` (and may depend on `cfx-keys`/`cfx-ui`
  per package when a vertical requires it).
- `cfx-tools`: depends on everything; never depended on by anything.

### Versioning

- **Independent semver per repo**, Changesets per repo.
- Cross-repo dep ranges use **caret** by default (`^x.y.z`) and **tilde**
  (`~x.y.z`) for `cfx-keys` consumers (force conscious patch upgrades).
- A monthly *integration tag* (`integration-2026-05`) records which versions
  of each repo were tested together; lives in `cfx-meta`.

### CI

Each repo has its own GitHub Actions:

- Lint + typecheck + test on every PR.
- Build artefacts cached to S3-compatible bucket (no Vercel).
- `cfx-keys`:
  - `cargo audit` equivalent (`pnpm audit --prod` + `socket.dev` check).
  - Reproducible build verification (`SOURCE_DATE_EPOCH` pinned).
  - SBOM (CycloneDX) attached to every release.
- Cross-repo: `cfx-meta` runs a nightly *matrix* job that pulls latest
  release from each repo, runs the example apps, and posts pass/fail to a
  status badge.

### Local DX after the split

Because contributors often touch multiple repos at once, ship a workspace
template:

```bash
git clone https://github.com/cfx/cfx-meta && cd cfx-meta
./scripts/clone-all.sh ~/cfx       # clones cfx-core, cfx-keys, cfx-ui, …
cd ~/cfx
pnpm dlx @cfxdevkit/scaffold workspace --link-local
# → writes a root pnpm-workspace.yaml that points at each sibling clone,
#   so `workspace:*` resolution works across repos as if it were one.
```

When a contributor wants to release, they `unlink-local` and the lockfile
goes back to npm ranges.

This pattern (used by Babel, Yarn, and Rome/Biome before the rewrite) keeps
multi-repo refactors tolerable.

### Migration plan (sequenced; each step is mergeable on its own)

1. **Carve `cfx-keys` first.**
   - Move `framework/services` + `framework/wallet` to a new repo.
   - Publish under existing names (`@cfxdevkit/services`, `@cfxdevkit/wallet`).
   - In `root/`, replace those folders with stub READMEs pointing to the
     new repo, and switch internal consumers to npm ranges.
   - **Why first:** smallest, highest-value, sets the pattern.
2. **Carve `cfx-tools`.** Lowest risk — nothing in Tier 0/2/3 imports it.
3. **Carve `cfx-domain`.** Audit each domain's deps; some may need to wait
   for their corresponding project to move first.
4. **Carve `cfx-ui`.** Coordinate with project teams to bump npm range.
5. **Rename root → `cfx-core`.** What's left after the above moves *is*
   `cfx-core`. Add a tombstone tag to the old `root/` history.
6. **Bootstrap `cfx-meta`** as a new (empty-ish) repo containing only
   architecture docs, ADRs, the clone-all script, and CI dispatch
   workflows.

Each step is reversible until the npm version is published; the carved
folder stays in `root/` history (we do not rewrite history).

### What stays in `root/` (now `cfx-core`)?

After the split: `framework/{core,protocol,contracts,compiler,executor,devnode,testing}`,
`infrastructure/`, project-agnostic CI. Nothing else.

## Consequences

### Positive

- Repo size: each new repo is < 50 MB cloned vs. ~500 MB today.
- Audit scope for `cfx-keys` shrinks from "whole framework" to "one repo".
- Independent release cadence (UI weekly, keys quarterly, core annually).
- Smaller `node_modules` per consumer; faster `pnpm install`.
- Project teams can pin Tier 0 versions independently.

### Negative

- Cross-repo refactors require coordinated PRs (mitigated by the
  `clone-all` workspace template).
- Six CI configurations to maintain (mitigated by sharing
  `tools/ci-templates` published as an action).
- More release ceremony (mitigated by per-repo Changesets bots).
- Initial migration effort (~2 engineer-weeks, sequenced over a quarter).

### Mitigations / Non-goals

- **We do not** require git submodules; they're optional in `cfx-meta`
  and discouraged for contributors.
- **We do not** introduce a private npm registry; use public registry +
  optional Verdaccio cache.
- **We do not** split per package (`cfx-react`, `cfx-theme`, `cfx-defi-react`,
  …) — that produces dozens of repos with the same release cadence and
  defeats the purpose. Tier-aligned grouping is the sweet spot.

## Alternatives considered

1. **Keep monorepo, harder caching.** Rejected: cache misses are not the
   primary pain; coupled release cadences and audit scope are.
2. **Two repos: framework vs everything else.** Rejected: doesn't isolate
   the `cfx-keys` trust boundary, which is the whole point.
3. **One repo per package (Babel-style).** Rejected: ~30 repos is more
   overhead than monorepo without proportional benefit.
4. **Submodules.** Rejected: submodule UX is widely known to be poor;
   `pnpm` linked clones do the job.
5. **Yarn / Nx workspaces with project boundaries.** Rejected: same
   coupling problem inside a single git repo.

## Open questions

- Should `cfx-keys` further split into `cfx-keystore` (services) and
  `cfx-wallet` (wallet)? **Tentative answer:** no, they release together;
  they share the audit perimeter.
- Where do the smart-contract artefacts (`framework/contracts/deployments/*.json`)
  live after the split? **Tentative answer:** stay with `cfx-core` because
  ABIs are a chain-protocol concern.
- Should hardware-specific Electro protocol code move into `cfx-domain`?
  **Tentative answer:** no for now; keep it project-local until a second
  consumer proves reusable demand.

## Acceptance checklist (when the split is complete)

- [ ] `cfx-keys` repo exists, publishes `@cfxdevkit/{services,wallet}`.
- [ ] `cfx-tools` repo exists, publishes `@cfxdevkit/{scaffold-cli,mcp-server,vscode-extension}`.
- [ ] `cfx-domain` repo exists, publishes `@cfxdevkit/{game-engine,automation}`.
- [ ] `cfx-ui` repo exists, publishes `@cfxdevkit/{react,defi-react,theme,wallet-connect}`.
- [ ] `cfx-core` (renamed from `root/`) publishes `@cfxdevkit/{core,protocol,contracts,compiler,executor,devnode,testing}`.
- [ ] `cfx-meta` exists with this ADR, the integration matrix, and `clone-all.sh`.
- [ ] Each project (`cas`, `chainbrawler`, `conflux-phaser`, `electro`) builds against published versions.
- [ ] First post-split integration tag published.
