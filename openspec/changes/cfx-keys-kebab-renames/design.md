## Context

The `cfx-keys` monorepo enforces a `kebab-groups` linting rule to maintain consistent file naming conventions across packages. Currently, `repos/cfx-keys/packages/signer-session/src` contains two files matching the `onekey*.ts` pattern that violate this rule, triggering a warning in the CI validation pipeline. This inconsistency creates friction with automated tooling, reduces readability, and can cause issues in case-sensitive environments. The change targets these specific files to align with the established kebab-case standard, ensuring the validation suite passes and the codebase remains maintainable.

## Goals / Non-Goals

**Goals:**
- Rename `onekey*.ts` files in `signer-session/src` to `onekey-diagnostics.ts` and `onekey-session.ts`.
- Update all static imports, test references, and configuration paths to reflect the new filenames.
- Resolve the `kebab-groups` warning and ensure `pnpm run cdk -- repo check kebab-groups` passes without errors.
- Maintain module exports and internal logic unchanged to preserve runtime behavior.

**Non-Goals:**
- Refactoring the internal implementation, exports, or dependencies of the renamed files.
- Addressing other linting errors or warnings in the validation suite (3/9 passed, 5 errors remain out of scope).
- Modifying file naming conventions in other packages, services, or external tooling configurations.
- Implementing automated pre-commit hooks or broader monorepo linting policy changes.

## Decisions

- **Direct File Renaming vs. Automated AST Transformation:** We will perform direct file renames coupled with explicit import updates rather than relying on complex AST transformation scripts. Given the small scope (2 files), manual or IDE-assisted renaming ensures accuracy, preserves file metadata, and avoids unintended side effects from automated parsers that might miss edge-case references.
- **Target Naming Convention:** The files will be renamed to `onekey-diagnostics.ts` and `onekey-session.ts`. This preserves the semantic distinction between the two modules while strictly adhering to kebab-case. Alternative names like `onekey-diag.ts` or `onekey-session-manager.ts` were considered but rejected to maintain brevity and consistency with existing naming patterns in the package.
- **Import Resolution Strategy:** All imports will be updated to use the new relative paths. Since TypeScript and Node.js resolve modules based on exact filenames, dynamic imports or string-based module loading will be audited. If any exist, they will be converted to static imports or explicitly handled to prevent runtime resolution failures. A repository-wide string search will be performed to catch non-standard references.

## Risks / Trade-offs

- [Risk] Broken imports during the transition period. → [Mitigation] Run `pnpm run cdk -- repo check kebab-groups` and the full test suite immediately after renaming. Use a single atomic commit to ensure the codebase never exists in a broken state on the main branch.
- [Risk] Stale CI/CD caches or build artifacts referencing old filenames. → [Mitigation] Trigger a clean rebuild in CI. Document the change in the PR description to alert reviewers and CI systems. Verify cache invalidation if using persistent build caches.
- [Risk] Overlooked dynamic imports or external tooling configurations (e.g., bundlers, test runners, documentation). → [Mitigation] Perform a repository-wide string search for `onekey` before and after the rename. Cross-check `tsconfig.json`, `vitest/jest` configs, and README files for hardcoded paths.

## Migration Plan

1. **Audit:** Run a global search for `onekey` in `repos/cfx-keys` to identify all import statements, test files, and configuration references.
2. **Rename & Update:** Rename `onekey*.ts` to `onekey-diagnostics.ts` and `onekey-session.ts`. Update all import paths accordingly.
3. **Validate:** Execute `pnpm run cdk -- repo check kebab-groups` to confirm the warning is resolved. Run the full test suite and type checks (`tsc --noEmit`) to ensure no broken references.
4. **Commit & Deploy:** Commit the changes with a clear message referencing the linting rule. Push to the target branch. CI will automatically validate the fix.
5. **Rollback Strategy:** If the change introduces unexpected regressions, revert the commit using `git revert <commit-hash>`. The original filenames and imports will be restored, and the `kebab-groups` warning will reappear, but system stability will be preserved.

## Open Questions

- Are there any external integrations, CI scripts, or documentation that hardcode the old filenames? (To be verified during the audit phase)
- Should we formalize a pre-commit hook or ESLint rule to prevent future kebab-case violations in `cfx-keys`? (Out of scope for this change but recommended for long-term hygiene)
- Does the `signer-session` package expose these files via barrel exports (`index.ts`)? If so, will the barrel exports need updating to match the new filenames? (To be confirmed during import audit)
