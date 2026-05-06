# Plan: CI/CD + Hetzner VPS Infrastructure for `cfxdevkit/framework`

**TL;DR** — Port and adapt devkit's battle-tested CI/CD patterns to the framework monorepo. The VPS (Hetzner CAX11 ARM64) already exists and runs the devkit stack; the framework adds docs hosting and will progressively add npm publishing, project backend containers, and changeset-based releases. The Ansible infra lives in `infrastructure/` and the workflows in `.github/workflows/`.

---

### Phase 1 — VPS Infrastructure (`infrastructure/`)

*Parallel with Phase 2 — no code dependencies between phases.*

**1.1 Port Ansible playbook from devkit**
- Copy `devkit/infra/ansible/` → `infrastructure/ansible/` in the framework repo
- Roles to port: `base` (user/SSH/ufw/fail2ban), `docker`, `caddy`, `backups` (restic), `monitoring` (uptime-kuma)
- Same security model as devkit:
  - `deploy` user only; root SSH disabled
  - ufw — 22/80/443 only
  - fail2ban SSH jail
  - unattended-upgrades (security-only)
- Update `vars/all.yml` to add `docs` app entry and port, and point DNS `docs.cfxdevkit.org` → VPS IP
- Caddy snippet at `roles/caddy/templates/sites/docs.j2` for `docs.cfxdevkit.org`
- App directory: `/opt/apps/docs/` with a `docker-compose.yml` and `.env`

**1.2 Document secrets needed** (in `infrastructure/secrets/README.md` — already exists)
| Secret name | Used in | Notes |
|---|---|---|
| `VPS_HOST` | deploy workflows | VPS IP |
| `VPS_SSH_KEY` | deploy workflows | deploy user private key |
| `GHCR_TOKEN` | VPS docker pull (if private) | PAT with `read:packages` |
| `CODECOV_TOKEN` | ci.yml | Coverage upload |
| npm OIDC | release.yml | No secret — repo-level trusted publisher config |

---

### Phase 2 — Docs Deploy Workflow (`.github/workflows/`)

**2.1 Add `Dockerfile` for docs-site**
- Path: `repos/cfx-tools/packages/docs-site/Dockerfile`
- Multi-stage: `node:24-bookworm-slim` builder → `node:24-bookworm-slim` runner
- `RUN pnpm install --frozen-lockfile && pnpm build` → `CMD ["pnpm", "start"]`
- Expose port 3100
- Platform: `linux/amd64,linux/arm64` (VPS is ARM64, but amd64 for GitHub runners + Docker Hub flexibility)

**2.2 Add `build-docs.yml`**
- Triggers: push to `dev`/`main` with path filter on:
  - `repos/cfx-tools/packages/docs-site/**`
  - `.github/workflows/build-docs.yml`
  - `repos/cfx-tools/packages/docs-site/content/wiki/**` (wiki sync output)
- `workflow_dispatch` for manual
- Jobs:
  1. Checkout + pnpm install
  2. Run `node scripts/sync-wiki.mjs` to regenerate wiki MDX
  3. Docker buildx → push to `ghcr.io/cfxdevkit/framework/docs-site:<sha>,edge,latest`
  4. Artifact: the built image digest
- Uses `GITHUB_TOKEN` for GHCR push (no extra secret needed for public)

**2.3 Add `deploy-docs.yml`**
- Triggers: after `build-docs.yml` completes on `main`; `workflow_dispatch` with tag input
- Job: SSH → VPS → `docker compose pull && docker compose up -d --remove-orphans && docker image prune -f`
- Uses `appleboy/ssh-action@v1`, secrets `VPS_HOST` + `VPS_SSH_KEY`
- Pattern identical to devkit's `deploy-cas.yml`

---

### Phase 3 — npm Release Upgrade

**3.1 Upgrade `release.yml` to OIDC trusted publishing** *(depends on Phase 1 — secrets setup)*
- Remove `NODE_AUTH_TOKEN` secret dependency
- Port devkit's OIDC pattern: `pnpm pack` + `npm publish` (so npm CLI handles OIDC exchange)
- Per-package: iterate all `repos/cfx-*/packages/*/` dirs, skip private/internal packages (e.g., docs-site, moon-config, biome-config, tsconfig)
- Add `id-token: write` permission to the publish job
- Prerequisites: register each npm package as a Trusted Publisher on npmjs.com pointing at this repo + `release.yml`

**3.2 Add Changesets automation (`changeset-release.yml`)**
- Uses `changesets/action@v1`
- Triggered on push to `main`
- Two modes:
  - When changesets exist → open/update a "Version Packages" PR (bumps versions, updates CHANGELOG)
  - When the PR merges → runs release.yml (publish to npm)
- Replaces manual `pnpm release patch` flow
- Requires `GITHUB_TOKEN` with `contents: write` + `pull-requests: write`

---

### Phase 4 — Per-project Container Workflows (future, when projects are ready)

**Pattern (reuse for each project backend):**
- `build-<project>.yml` — path-filtered build → push to GHCR (`edge` on main, semver on tag)
- `deploy-<project>.yml` — SSH deploy after build succeeds
- Reference: devkit's `build-cas.yml` + `deploy-cas.yml`

*Scope note: CAS, chainbrawler, electro backends are WIP — defer these workflows until the packages are implemented.*

---

### Relevant files to create/modify

| File | Action |
|---|---|
| `infrastructure/ansible/` | New — port from `devkit/infra/ansible/` |
| `infrastructure/ansible/roles/caddy/templates/sites/docs.j2` | New — Caddy snippet for `docs.cfxdevkit.org` |
| `infrastructure/ansible/vars/all.yml` | New — add docs service + port |
| `repos/cfx-tools/packages/docs-site/Dockerfile` | New — multi-stage Next.js build |
| `.github/workflows/build-docs.yml` | New |
| `.github/workflows/deploy-docs.yml` | New |
| `.github/workflows/release.yml` | Modify — OIDC upgrade |
| `.github/workflows/changeset-release.yml` | New |
| `infrastructure/secrets/README.md` | Modify — document new secrets |

---

### Verification

1. Run Ansible playbook locally against VPS (dry-run mode: `--check`)
2. Trigger `build-docs.yml` via `workflow_dispatch` — confirm GHCR image appears
3. Trigger `deploy-docs.yml` manually — confirm `https://docs.cfxdevkit.org` serves the docs site
4. Add a test changeset, push to `main` — confirm PR opens with version bump
5. Tag a release, confirm OIDC npm publish runs without `NODE_AUTH_TOKEN`

---

### Decisions to confirm

**A — Docs domain**: `docs.cfxdevkit.org` vs `www.cfxdevkit.org`

**B — Docs hosting mode**: Dockerized `next start` (port 3100, Caddy proxy) vs. static export (Caddy file_server). Static export is simpler and has no runtime Node.js process; dockerized is consistent with the rest of the stack and easier to update. **Recommended: Dockerized.**

**C — VPS scope**: Single VPS for all services (docs + future CAS + monitoring) vs. separate VPS for docs. Given the Hetzner CAX11 is already set up and lightly used, sharing it is the right call for now.

**D — Release trigger**: Changeset PR merge flow vs. manual semver tag. **Recommended: Changesets** — but manual tag dispatch as escape hatch.

---
A) for now let's keep www.cfxdevkit.org, when the project evolve we will move the docs to docs.cfxdevkit.org.
b) let's dockerize the docs site, it will be easier to maintain and update.
c) let's keep using the same VPS for docs and CAS, we can always split later if needed.
d) let's use the changeset PR merge flow for releases, it's more automated and less error-prone than manual tagging.

*Execution can begin once the VPS SSH key is provided and secrets are added to the repo.*
