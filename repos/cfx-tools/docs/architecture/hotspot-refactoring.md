# Hotspot Refactoring: Module Boundaries

This document describes the module boundaries established as part of the `refactor-hard-hotspots`
change, which resolved all hard hotspot violations across the tooling-cli and llm-agents packages.

## What Are Hard Hotspots?

A **hard hotspot** is a source file that meets or exceeds both:
- **Line count**: ≥ 400 lines
- **Complexity score**: ≥ 1000 (based on line count × commit frequency)

Hard hotspots are enforced by `pnpm run check:hotspots` (via `moon run arch-check:check-hotspots`)
and block CI/CD pipelines when `--fail-on-hard` is active.

## Pre-Refactoring State

The following four files were identified as hard hotspots:

| File | Lines | Score |
|------|-------|-------|
| `tooling-cli/src/repo-namespace.ts` | ~632 | 1444 |
| `tooling-cli/src/agent-namespace.ts` | ~430 | 1355 |
| `tooling-cli/src/repo-namespace.test.ts` | ~716 | 1111 |
| `llm-agents/workers/agents/check.ts` | ~991 | 991 |

## Post-Refactoring State

All four files are now within the hard hotspot thresholds (< 300 lines, score well below 1000):

| File | Lines | Notes |
|------|-------|-------|
| `tooling-cli/src/repo-namespace.ts` | 269 | CLI command router for `repo` |
| `tooling-cli/src/agent-namespace.ts` | 213 | CLI command router for `cdk agent` |
| `tooling-cli/src/repo-namespace.test.ts` | 147 | Focused tests for repo-namespace |
| `llm-agents/workers/agents/check.ts` | 198 | Orchestrator; delegates to submodules |

## Module Boundaries: `llm-agents/workers/agents/`

The `check.ts` agent worker was decomposed into focused submodules:

```
workers/agents/
├── check.ts              # (198 lines) Orchestrator: runAgentCheck entry point, flag parsing, branch/PR logic
├── check-artifacts.ts    # (245 lines) OpenSpec change materialization and validation artifact I/O
├── check-plan.ts         # (128 lines) Agent-driven plan building from actionable validation steps
├── check-render.ts       # (273 lines) Report rendering: console summary, markdown report, JSON normalization
└── check-types.ts        # (143 lines) Shared types, constants, and pure utility functions
```

**Dependency order** (no circular dependencies):
```
check-types.ts ← check-render.ts ← check-plan.ts ← check-artifacts.ts ← check.ts
```

## Module Boundaries: `tooling-cli/src/`

The CLI namespace files are organized as single-responsibility command routers. Each file handles
one namespace (`repo`, `agent`) and delegates to domain-specific modules:

```
tooling-cli/src/
├── repo-namespace.ts       # repo — routes check/generate/merge/review/commit commands
│   ├── delegates to: repo-merge.ts (merge logic)
│   ├── delegates to: monorepo-units.ts (unit listing)
│   └── delegates to: agent-runtime.ts (agent session scope)
└── agent-namespace.ts      # cdk agent — routes all agent workflow commands
    ├── delegates to: agent-config.ts (config management)
    ├── delegates to: agent-endpoint.ts (PI endpoint handling)
    ├── delegates to: agent-help.ts (help text generation)
    ├── delegates to: agent-merge.ts (deterministic merge workflows)
    ├── delegates to: agent-runtime.ts (scope/session management)
    └── delegates to: agent-session-setup.ts (interactive session setup)
```

## Enforcement

Hotspot thresholds are enforced by the `arch-check` package:
- **Hard threshold**: ≥ 400 lines AND score ≥ 1000 → CI failure
- **Soft threshold**: Warnings only (logged but non-blocking)
- **Check command**: `pnpm -w run check:hotspots`

To verify no hard hotspots exist:
```bash
pnpm -w run check:hotspots
# Expected: Code hotspots: ok — 0 hard violation(s)
```
