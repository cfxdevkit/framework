## 1. Documentation Updates

- [ ] 1.1 Update README, ARCHITECTURE, CHANGELOG, and structure docs to match the keeper apps and actual package state.
- [x] 1.2 Remove stale references to deleted showcase apps, deprecated local-workspace patterns, and the hardware-bridge stub.
- [ ] 1.3 Review `docs/architecture/` content for references to deleted patterns or apps and update it for the release surface.

## 2. Workspace and Spec Hygiene

- [ ] 2.1 Re-verify workspace manifests and Moon config after cleanup changes land.
- [x] 2.2 Archive or clearly mark stale CAS OpenSpec artifacts that should not remain active for the release.
- [x] 2.3 Remove remaining deprecated VS Code extension aliases that are scoped to release cleanup.
- [ ] 2.4 Re-check `projects/examples/package.json` and infrastructure routing config after the example-app cleanup lands.

## 3. Quality Gates and Release Checklist

- [ ] 3.1 Run `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, and `pnpm check:unused` from the repo root.
- [ ] 3.2 Confirm the repo is clean and the release checklist is ready before creating the `v0.1.0` tag.
- [ ] 3.3 Confirm shared-backend alignment, legacy cleanup, keeper showcase completion, and CAS cleanup are all reflected in the final release checklist before tagging.
