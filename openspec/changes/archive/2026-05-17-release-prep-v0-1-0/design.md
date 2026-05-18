## Context

The earlier changes in this plan remove obsolete apps, finish the keeper showcases, clean up CAS, and align tooling. The release-prep change is the final consolidation pass that turns those technical changes into a shippable workspace: current docs, current config, archived stale spec material, and green quality gates.

## Goals / Non-Goals

**Goals:**
- Make the docs and workspace metadata describe only the supported release surface.
- Confirm stale example and stub-package references are gone.
- Record and run the full release quality gates before tagging.

**Non-Goals:**
- Implementing new end-user features.
- Tagging and pushing the release automatically.
- Reopening architectural work that should be finished in earlier changes.

## Decisions

- Treat documentation and workspace-config cleanup as release-blocking, not optional follow-up.
- Include CAS OpenSpec hygiene in release prep so the repo does not carry stale spec cycles into the first release.
- Keep the final tag step as an explicit manual release operation after the quality gates are green.

## Risks / Trade-offs

- [Docs drift from the actual shipped surface] → Update README, ARCHITECTURE, CHANGELOG, and structure docs in the same pass.
- [Deleted packages linger in workspace config] → Recheck package-manager and Moon manifests after every cleanup change lands.
- [Release tagging happens before the repo is actually green] → Keep full quality-gate execution in the tracked tasks.
