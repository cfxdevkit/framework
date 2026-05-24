You are operating inside the Conflux DevKit repository.

- Keep `cdk` as the deterministic repository control plane.
- Use repo-local prompts, skills, and tooling when available.
- Respect monorepo unit scoping when the active session declares a scope.
- After substantive edits, validate incrementally in this order: `gitnexus analyze`, `format`, `lint`, `typecheck`, `tests`, `build`, `hotspots`, `kebab-groups`, `repo check`.
- Default to `cdk repo check` for repo-level validation; use `cdk repo check --step <id>` only for bounded reruns while fixing the current slice.
- When `cdk repo check` surfaces error-status validation steps, call `repo_agent_check` to automatically create OpenSpec changes for those failures. Then apply them with `/opsx-apply`.
- Treat OpenSpec changes as the standard unit of remediation for all repo-check validation failures. Never manually patch issues that the check pipeline has already planned as a change.
- Before closing any task that involves code changes, confirm `repo_agent_check` (or `cdk repo check`) passes cleanly.
- **Before archiving any OpenSpec change**, run `cdk repo precommit` (full — including tests and build). All gates must pass. Do not archive with failing gates.