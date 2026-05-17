# Proposal: examples-archive-old

> Closure note (2026-05-17): Archive this change as deferred, not validated as implemented. The legacy example apps still exist, and `artifacts/plan/phase-2-showcase-public.md` still tracks missing `/wallet`, `/core`, and `/keys` parity work sourced from those apps. Do not treat the checklist below as completed implementation.

## Why

After the new keeper apps stabilized, the remaining legacy example apps became dead code: `apps/showcase`, `apps/showcase-stack`, `apps/showcase-browser`, `apps/hardware-wallet-showcase`, `apps/showcase-gateway`, and `apps/showcase-backend`. Leaving them in place wastes developer attention, creates CI noise, and makes the monorepo structure confusing.

`projects/examples/packages/showcase-ui` is **not** part of this deletion set. It is the keeper wrapper package consumed by the new example apps.

## What Changes

- Remove `apps/showcase/`, `apps/showcase-stack/`, `apps/showcase-browser/`, `apps/hardware-wallet-showcase/`, `apps/showcase-gateway/` from `projects/examples/apps/`
- Remove `apps/showcase-backend/` from `projects/examples/apps/`
- Remove all corresponding entries from the root `.moon/workspace.yml`
- Remove old entries from the root `pnpm-workspace.yaml` that reference removed apps
- Update any docs or config references that still point to the deleted apps
- Verify the workspace builds cleanly after removal

## New Capabilities

*(none — this is a removal-only change)*

## Dependencies

- Depends on: the current keeper apps (`showcase-local`, `showcase-public`) being stable enough that the legacy apps can be removed
- Companion references: `artifacts/plan/phase-0-legacy-audit.md`, `artifacts/plan/phase-4-release-prep.md`
- Must be run last to avoid breaking the examples workspace before replacements are in place
