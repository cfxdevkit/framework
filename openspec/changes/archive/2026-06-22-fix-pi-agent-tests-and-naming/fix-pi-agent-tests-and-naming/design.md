## Context

The `pi-agent` package currently fails CI validation due to two distinct issues. First, `pi-agent:test` fails because test expectations do not account for newly introduced `approvalMode` and `modelPolicies` fields in the runtime output. Second, the `kebab-groups` lint rule flags non-kebab-case filenames in `pi-agent/src/commands` (e.g., `repo*.ts`), which increases context switching and violates repository naming conventions. The package operates within a monorepo structure where consistent naming and passing CI checks are mandatory for deployment. Changes must be localized to `pi-agent` to avoid cross-package ripple effects.

## Goals / Non-Goals

**Goals:**
- Update `pi-agent` test expectations to correctly assert the presence of `approvalMode: "defer"` and the nested `modelPolicies` object.
- Rename `src/commands/repo*.ts` files to kebab-case (`repo-actions.ts`, `repo-check.ts`, `repo-commit.ts`, `repo-run.ts`, `repo-status.ts`) and update all internal import paths.
- Ensure `pnpm run test` and `pnpm run cdk -- repo check kebab-groups` pass without errors or warnings.

**Non-Goals:**
- Refactoring core pi-agent business logic or runtime behavior.
- Modifying linting rules, CI configuration, or monorepo tooling.
- Addressing naming or test issues in other packages.

## Decisions

- **Test Expectation Alignment**: Update the test fixtures/assertions to explicitly include `approvalMode` and `modelPolicies` in the expected output. *Rationale*: The code already outputs these fields; updating tests is the lowest-risk path to restore CI health. *Alternatives considered*: Stripping fields from the code output (rejected as it breaks downstream consumers/schema contracts) or mocking the fields (rejected as it reduces test fidelity and masks real behavior).
- **Kebab-Case Renaming Strategy**: Rename the five `repo*.ts` files to kebab-case and perform a repository-wide import replacement within `pi-agent`. *Rationale*: Directly satisfies the `kebab-groups` rule while preserving the logical grouping of command handlers. *Alternatives considered*: Moving files into a `repo/` subdirectory (rejected as it adds unnecessary nesting and breaks existing relative import patterns) or disabling the lint rule (rejected as it undermines repository consistency standards).
- **Import Resolution Approach**: Use a systematic import path update across all `pi-agent` source files rather than relying on dynamic resolution or wildcard imports. *Rationale*: Ensures deterministic builds and prevents runtime module resolution failures. *Alternatives considered*: Relying on IDE auto-fix only (rejected due to potential human error in monorepo environments and inconsistent tooling across developer machines).

## Risks / Trade-offs

- [Risk] Broken import paths during file renaming → [Mitigation] Execute renames via CLI/IDE refactoring tools, run `pnpm run build` and `pnpm run test` immediately after, and verify with `pnpm run cdk -- repo check kebab-groups`.
- [Risk] Test snapshot drift if runtime output changes again → [Mitigation] Add inline comments to test expectations explaining the schema contract, and rely on CI to catch future mismatches early.
- [Trade-off] Slightly longer initial PR review due to multiple file renames → [Mitigation] Group changes logically in the PR and provide a clear diff summary to streamline review.

## Migration Plan

1. Update test files in `pi-agent/src/__tests__/` to include `approvalMode: "defer"` and the full `modelPolicies` structure in expected outputs.
2. Rename `pi-agent/src/commands/repo*.ts` to kebab-case equivalents.
3. Run a scoped import replacement across `pi-agent/src/` to update all references to the renamed files.
4. Execute `pnpm run test` to verify test suite passes.
5. Execute `pnpm run cdk -- repo check kebab-groups` to confirm lint warning is resolved.
6. Commit and push changes. Rollback strategy involves reverting the commit; no database or external state changes are involved, making rollback instantaneous and safe.

## Open Questions

- Are there any external tooling or scripts outside the monorepo that reference the original `repo*.ts` filenames directly? (Verification needed before merge).
- Should the `modelPolicies` structure be standardized in a shared TypeScript interface to prevent future test drift? (Recommended as a follow-up, out of scope for this remediation).
