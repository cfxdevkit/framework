## Context

All five planned OpenSpec changes tracking the monorepo consolidation are `all_done`. The workspace configs (`pnpm-workspace.yaml`, `.moon/workspace.yml`) already reference only live packages — legacy app entries were removed as part of the `legacy-showcase-cleanup` change. The `projects/cas/openspec/changes/archive/` already contains the stale `examples-shared-foundation` marker. What remains is purely documentation and process: write the release notes, align static docs, archive the five changes, and confirm quality gates are green.

## Goals / Non-Goals

**Goals:**
- Archive the five completed changes so the `openspec/changes/` active directory is empty
- Write the `v0.1.0` CHANGELOG entry documenting all stabilised packages and application milestones
- Remove stale package and app entries from `ARCHITECTURE.md` and `docs/STRUCTURE.md`
- Confirm `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, `pnpm check:unused` all pass

**Non-Goals:**
- No code changes to any package
- No changes to workspace manifest files (already clean)
- No new OpenSpec specs for CAS wizard features (those are post-v0.1.0)

## Decisions

**Archive before tagging, not after.** Archiving first ensures the active changes directory is clean and the `openspec list` output reflects only genuinely in-progress work. This makes the repository state unambiguous at the v0.1.0 commit.

**CHANGELOG format.** Use `## [0.1.0] - 2026-05-20` heading with subsections: Framework Packages, Applications, Infrastructure, Breaking Changes (none). Concise bullet per package, not prose.

**Quality gates.** Run in order: typecheck → lint → test → check:unused. A failure in typecheck blocks the others; lint and test are independent.

## Risks / Trade-offs

[Risk] check:unused may surface remaining unused exports that weren't caught in Phase 1–3 → Mitigation: inspect the report; known intentional aliases (ABI names) are already in `knip.config.ts`. Add any new acceptable ones with a comment before declaring the gate clean.

[Risk] ARCHITECTURE.md edits could accidentally remove entries for still-live packages → Mitigation: cross-reference against COMPLETION_PLAN.md package table and verify each removal against the actual directory.
