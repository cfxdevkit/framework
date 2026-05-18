## Why

Even after the feature and cleanup changes land, the release still needs a final convergence pass across docs, workspace configuration, and quality gates. Without that pass, the repo can claim a finished release while still advertising stale surfaces or carrying failing checks.

## What Changes

- Update release-facing documentation to match the keeper apps and the actual package state.
- Verify workspace configuration and package metadata no longer reference removed apps or stub packages.
- Archive or mark stale CAS OpenSpec artifacts and run the full release quality gates.
- Leave a concrete release checklist ready for the `v0.1.0` tag.

## Capabilities

### New Capabilities
- `framework-release-readiness`: defines the documentation, cleanup, and quality-gate conditions for the first public release.

### Modified Capabilities
- None.

## Impact

- Affected code: root docs, workspace manifests, CAS OpenSpec artifacts, release checklist material.
- Affected systems: public documentation, quality-gate readiness, release workflow clarity.
