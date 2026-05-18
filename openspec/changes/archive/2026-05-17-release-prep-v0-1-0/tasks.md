## 1. Documentation Updates

- [x] 1.1 Update README, ARCHITECTURE, CHANGELOG, and structure docs to match the keeper apps and actual package state.
- [x] 1.2 Remove stale references to deleted showcase apps, deprecated local-workspace patterns, and the hardware-bridge stub.
- [x] 1.3 Review `docs/architecture/` content for references to deleted patterns or apps and update it for the release surface.

## 2. Workspace and Spec Hygiene

- [x] 2.1 Re-verify workspace manifests and Moon config after cleanup changes land.
- [x] 2.2 Archive or clearly mark stale CAS OpenSpec artifacts that should not remain active for the release.
- [x] 2.3 Remove remaining deprecated VS Code extension aliases that are scoped to release cleanup.
- [x] 2.4 Re-check `projects/examples/package.json` and infrastructure routing config after the example-app cleanup lands.

## 3. Quality Gates and Release Checklist

- [x] 3.1 Run `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, and `pnpm check:unused` from the repo root.
- [x] 3.2 Confirm the repo is clean and the release checklist is ready before creating the `v0.1.0` tag.
        - All 5 quality gates pass: hotspots (0 hard), lint (36/36), typecheck (36/36), test (36/36), check:unused (exit 0). Working tree reflects 13-file release-prep cleanup.
- [x] 3.3 Confirm shared-backend alignment, legacy cleanup, keeper showcase completion, and CAS cleanup are all reflected in the final release checklist before tagging.
        - All predecessor changes archived: shared-backend-tooling-alignment (11/11), legacy-showcase-cleanup (9/9), showcase-local-refactor (10/10), showcase-public-completion (23/23), cas-frontend-cleanup (8/8).
