## Context

Archive directories in the monorepo hold packages that were superseded but not deleted.
They are picked up by workspace globs, which causes them to appear in installs and builds.

## Goals / Non-Goals

**Goals:**
- Delete both archive package trees from disk
- Confirm zero live imports before deletion

**Non-Goals:**
- Removing any live package
- Changing `pnpm-workspace.yaml`

## Decisions

**Delete, don't move.** Git history already preserves the code. A second move-to-archive
step adds no value.

**Verify before delete.** Run a `grep` pass across all non-archive source to confirm no
import of `@cfxdevkit/cdk-ai` or `@cfxdevkit/llm-tools` exists before deleting.

## Risks / Trade-offs

- Irreversible on disk (recoverable from git). Low risk given confirmed zero live importers.
