## Context

See `.ideas/monorepo-analysis.md` §2 and §4 for the full analysis.

## Goals / Non-Goals

**Goals:** C4, C3, C1, C2 as described in the proposal.

**Non-Goals:** C5 (domain dormancy), C6 (config package collapse), C7 (docs-site activation) — deferred to second pass.

## Decisions

### C1 design: workspace-utils location and API

Located in `repos/cfx-config/packages/workspace-utils` (cross-cutting/configuration tier, always dev-only per arch-rules). Uses `pnpm-workspace.yaml` + `package.json` as the canonical anchor (the most broadly valid check). Exported API:

```ts
export function findWorkspaceRoot(startDir?: string): string
// Walks up from startDir (default: process.cwd()) looking for pnpm-workspace.yaml + package.json.
// Throws if not found.

export const workspaceRoot: string
// Cached result of findWorkspaceRoot(process.cwd()) — computed once at import time.
```

The different anchor checks (some used `openspec`, some used `repos`, some used `.pi`) are unified to `pnpm-workspace.yaml` + `package.json` — the most portable. Packages that need a stricter check (e.g. arch-check requiring `openspec`) can still do a secondary check after getting the root.

### C2 design: test support location

- `tooling-cli-test-support.ts` → `tooling-cli/src/test-support.ts` (already local to tooling-cli tests)
- `llm-agents-test-support.ts` → `llm-agents/workers/tests/support.ts` (already exists partially)
- `@cfxdevkit/testing` removes the two sub-path exports; its public API stays unchanged.

### C3 design: moon registration

`pi-agent:build` becomes a dependency of `tooling-cli:build` (tooling-cli dynamically loads it at runtime; its dist must exist). `docs-pipeline:build` and `docs-site:build` join the standard `:build` sweep. `docs-site` uses `runInCI: false` since Next.js app builds under pids.max pressure.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| workspace-utils anchor change breaks edge-case resolution | The old anchors all found the same root in practice; the canonical `pnpm-workspace.yaml + package.json` is a strict superset |
| testing sub-path removal breaks a consumer we missed | grep for `testing/tooling-cli-test-support` and `testing/llm-agents-test-support` before removing |
| pi-agent registraion adds to build time | It's already built as a transitive dep; registering it just makes it explicit |
