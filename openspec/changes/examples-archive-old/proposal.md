# Proposal: examples-archive-old

## Why

After `examples-shared-foundation`, `examples-showcase-public`, and `examples-showcase-local` are implemented, the old example artifacts become dead code: `apps/showcase`, `apps/showcase-stack`, `apps/showcase-browser`, `apps/hardware-wallet-showcase`, `apps/showcase-gateway`, `apps/showcase-backend`, and `packages/showcase-ui` (the old version). Leaving them in place wastes developer attention, creates CI noise, and makes the monorepo structure confusing.

## What Changes

- Remove `apps/showcase/`, `apps/showcase-stack/`, `apps/showcase-browser/`, `apps/hardware-wallet-showcase/`, `apps/showcase-gateway/` from `projects/examples/apps/`
- Remove `apps/showcase-backend/` from `projects/examples/apps/`
- Remove the old `packages/showcase-ui/` (replaced by the rebuilt version in `examples-shared-foundation`)
- Remove all corresponding entries from `.moon/workspace.yml` in the `projects/examples` workspace
- Remove old `pnpm-workspace.yaml` globs that reference removed apps
- Verify the workspace builds cleanly after removal

## New Capabilities

*(none — this is a removal-only change)*

## Dependencies

- Depends on: `examples-shared-foundation`, `examples-showcase-public`, `examples-showcase-local` all fully implemented and verified
- Must be run last to avoid breaking the examples workspace before replacements are in place
