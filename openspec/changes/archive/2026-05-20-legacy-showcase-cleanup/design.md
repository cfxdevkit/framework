## Context

The monorepo is keeping two showcase applications for release: `showcase-local` and `showcase-public`. The remaining legacy apps reflect superseded architectures and should not stay wired into workspace tooling after their unique demo coverage is moved or declared obsolete. The hardware-bridge package is also a placeholder with no active role because the real hardware integrations already live in `@cfxdevkit/wallet`.

## Goals / Non-Goals

**Goals:**
- Remove unsupported example applications from the active workspace once replacement coverage is complete.
- Remove the unused hardware-bridge stub and every workspace/config reference to it.
- Ensure docs and infrastructure references describe only supported showcase surfaces.

**Non-Goals:**
- Building new demo functionality in this change.
- Reworking keeper app behavior beyond the minimum needed to replace legacy coverage.
- Preserving compatibility for deleted legacy routes, packages, or workspace entries.

## Decisions

- Delete legacy apps as whole directories instead of partially preserving internal modules. This avoids keeping dead code reachable through the workspace graph.
- Delete `@cfxdevkit/hardware-bridge` instead of promoting it to a supported abstraction, because hardware support already exists in `@cfxdevkit/wallet`.
- Treat config, docs, and infrastructure cleanup as part of the same retirement change so the repo does not temporarily advertise unsupported applications.

## Risks / Trade-offs

- [Legacy references survive outside the deleted directories] → Search workspace, Moon, docs, and infrastructure before considering the retirement complete.
- [A unique legacy demo is deleted before it is ported] → Gate deletion on the Phase 1 and Phase 2 consolidation work tracked in the other changes.
- [Workspace cleanup hides an accidental consumer] → Run typecheck, tests, and unused-reference checks after the removals.
