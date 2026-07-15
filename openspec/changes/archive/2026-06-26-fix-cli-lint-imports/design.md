## Context

The CLI package is currently failing CI validation due to import ordering and missing/extra imports. The pipeline reports 4 errors out of 9 checks, specifically flagging `devnode-server:lint` and `cli:lint` with import diff signals. These failures are isolated to the CLI module and stem from ESLint's import sorting rules not being satisfied. The current state requires a targeted remediation to align the import statements with the project's linting configuration without altering runtime logic or affecting dependent packages like `wallet` or `devnode-server`.

## Goals / Non-Goals

**Goals:**
- Resolve all lint and check errors in the CLI package by correcting import ordering and ensuring imports are present and used.
- Restore the CI pipeline to a passing state in a single pass without touching other packages.
- Ensure the fix is idempotent and strictly adheres to the existing ESLint configuration.

**Non-Goals:**
- Refactoring CLI command logic, changing external dependencies, or modifying runtime behavior.
- Addressing lint or check failures in other packages (`wallet`, `devnode-server`).
- Altering ESLint rules or project-wide configuration.

## Decisions

- **Automate import correction via ESLint `--fix`**: Instead of manually reordering imports, the implementation will leverage `pnpm run lint --fix`. This ensures consistent application of the project's import sorting rules, prevents human error, and automatically handles missing/unused import cleanup.
- **Isolate changes to the CLI package**: The fix will be scoped exclusively to the CLI module. This prevents unintended side effects in other services and aligns with the rationale that the issue is self-contained.
- **Validate against full check suite**: Post-fix validation will run `pnpm run check` to confirm that both the lint and build/check signals are resolved, ensuring no hidden type or compilation issues are introduced by the import changes.
- *Alternatives considered*: Manual line-by-line reordering (prone to inconsistency), adding `eslint-disable` comments (defeats linting enforcement), or relaxing ESLint rules (reduces code quality standards).

## Risks / Trade-offs

- [Risk] Import reordering may cause noisy git diffs or temporary merge conflicts if other branches modify the same CLI files. → [Mitigation] Commit the fix early, use atomic commits, and rebase against the target branch before merging.
- [Risk] ESLint auto-fix might incorrectly remove or add imports if the configuration is misaligned with actual usage. → [Mitigation] Review the generated diff against the actionable signals before committing; the signals confirm a straightforward sort/cleanup.
- [Trade-off] Automated fixing changes import order across the file, which may be visually disruptive in version history. → [Mitigation] Acceptable for a remediation change; future contributions will naturally follow the enforced order, reducing long-term friction.

## Migration Plan

1. **Reproduce**: Run `pnpm run lint` and `pnpm run check` locally to confirm the 4 errors.
2. **Apply Fix**: Execute `pnpm run lint --fix` targeting the CLI package to auto-resolve import ordering and missing/extra imports.
3. **Verify**: Run `pnpm run lint` and `pnpm run check` to ensure all signals pass and no new errors are introduced.
4. **Commit & Push**: Stage changes, commit with the change name, and push to the feature branch.
5. **CI Validation**: Monitor the pipeline for `devnode-server:lint` and `cli:lint` to transition from error to pass.
6. **Rollback**: Revert the commit if CI fails unexpectedly or if runtime behavior is affected (low probability given the purely stylistic nature of the change).

## Open Questions

- Are there any local development workflows or IDE extensions that rely on the previous import order? (Unlikely, but worth confirming with CLI maintainers.)
- Should the ESLint import sorting rules be explicitly documented in the contributing guide to prevent recurrence? (Recommended for future onboarding, but out of scope for this immediate fix.)
- Does the `wallet:build` check failure require any additional validation beyond the CLI import fix, or is it a downstream effect of the lint signal? (Based on actionable steps, it appears to be a cascading lint signal; post-fix validation will confirm.)
