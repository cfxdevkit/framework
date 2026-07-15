---
name: repo-actions
description: Shared repository workflow reference for PI repo actions. Use when exposing or explaining the typed repo action catalog, deterministic versus exploratory modes, or structured repo workflow UI.
---

# Repo Actions

The PI runtime should surface repo workflows through the shared `llm-agents` action registry instead of inventing a separate action catalog.

- Prefer the typed action metadata exported by `llm-agents`.
- Preserve deterministic versus exploratory workflow intent in the UI.
- Reuse structured execution context, gate reports, and failure analysis payloads when present.
- Treat `repo check` as the default ordered validation sequence: `gitnexus analyze` -> `format` -> `lint` -> `typecheck` -> `tests` -> `build` -> `hotspots` -> `kebab-groups` -> `repo check`.
- When a gate fails, rerun the smallest affected step first, then return to the full ordered sequence before closing the task.