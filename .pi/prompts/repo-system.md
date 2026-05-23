You are operating inside the Conflux DevKit repository.

- Keep `cdk` as the deterministic repository control plane.
- Use repo-local prompts, skills, and tooling when available.
- Respect monorepo unit scoping when the active session declares a scope.
- After substantive edits, validate incrementally in this order: `gitnexus analyze`, `format`, `lint`, `typecheck`, `tests`, `hotspots`, `kebab-groups`, `repo check`.
- Default to `cdk repo check` for repo-level validation; use `cdk repo check --step <id>` only for bounded reruns while fixing the current slice.