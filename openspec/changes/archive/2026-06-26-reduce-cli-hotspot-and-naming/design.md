## Context

The CLI package currently contains a hard hotspot in `keystore.ts` (590 lines), exceeding the complexity threshold and triggering CI failures. Concurrently, the `signer-session` package contains files matching the `onekey*.ts` pattern, which violates the kebab-case naming convention enforced by the lint pipeline. These issues impact developer velocity, increase cognitive load during code reviews, and block pipeline validation. The monorepo structure and strict linting rules require targeted refactoring without altering runtime behavior, changing cryptographic logic, or breaking external consumers.

## Goals / Non-Goals

**Goals:**
- Decompose `keystore.ts` into smaller, single-responsibility modules to eliminate the hard hotspot and reduce cyclomatic complexity per file.
- Rename `signer-session` files to explicit kebab-case identifiers (`onekey-diagnostics.ts`, `onekey-session.ts`) to resolve the naming warning.
- Maintain backward compatibility for internal imports using barrel exports.
- Pass `pnpm run cdk -- repo check hotspots -- --fail-on-hard` and `pnpm run cdk -- repo check kebab-groups`.

**Non-Goals:**
- Refactoring soft hotspots in other packages (`commit.ts`, `page.tsx`, etc.).
- Modifying cryptographic algorithms, key derivation functions, or CLI argument parsing logic.
- Updating external dependencies, CI configuration, or lint thresholds.
- Changing public API contracts for downstream consumers.

## Decisions

- **Modularization Strategy for `keystore.ts`:** Split the file by architectural layer rather than CLI command. CLI argument parsing and validation will move to `keystore-cli.ts`, cryptographic operations (encryption/decryption, key derivation) to `keystore-crypto.ts`, and file system/storage operations to `keystore-storage.ts`. The original `keystore.ts` will become a thin re-export barrel. *Rationale:* This separation isolates side effects, simplifies unit testing, and directly reduces file complexity. *Alternative considered:* Split by CLI command (e.g., `keystore-generate.ts`, `keystore-import.ts`). *Rejected because:* It would duplicate shared crypto/storage logic, increase coupling, and fail to address the core complexity threshold effectively.
- **File Renaming Strategy for `signer-session`:** Rename `onekey*.ts` files to explicit kebab-case names (`onekey-diagnostics.ts`, `onekey-session.ts`) and update all internal references. *Rationale:* Explicit names improve discoverability, align with the monorepo's naming convention, and remove ambiguous prefixes. *Alternative considered:* Keep the current prefix and add a lint exception. *Rejected because:* It masks the underlying organizational issue, violates the pipeline rule, and reduces long-term maintainability.
- **Import Compatibility via Barrel Exports:** Maintain a centralized `index.ts` in both packages to re-export all public symbols from the new structure. *Rationale:* Prevents cascading import breakages across the monorepo during the transition. Allows gradual adoption by other packages if needed without requiring immediate dependency updates.

## Risks / Trade-offs

- [Risk] Import path breakage across dependent packages. → [Mitigation] Update all internal imports atomically within the same PR. Run `pnpm tsc --noEmit` and the full test suite before merge. Use barrel exports to shield external consumers from structural changes.
- [Risk] Temporary increase in file count and navigation overhead. → [Mitigation] Group related files in dedicated subdirectories (e.g., `keystore/`) with clear `index.ts` exports. Document the new structure in package READMEs to aid developer onboarding.
- [Trade-off] Slightly longer initial PR review due to structural changes. → [Mitigation] Provide clear diff summaries and link to the hotspot/naming reports. Focus review on architectural boundaries and export contracts rather than line-by-line changes.

## Migration Plan

1. **Baseline Validation:** Run `pnpm run cdk -- repo check hotspots -- --fail-on-hard` and `pnpm run cdk -- repo check kebab-groups` to capture current state and confirm target metrics.
2. **Refactor `keystore.ts`:** Extract CLI parsing, crypto logic, and storage operations into separate files. Update the original file to re-export from new modules. Ensure all internal imports are updated to reference the new paths.
3. **Rename `signer-session` files:** Apply kebab-case naming to `onekey*.ts` files. Update all internal imports and references across the `signer-session` package.
4. **Validation:** Run `pnpm run cdk -- repo check hotspots -- --fail-on-hard` and `pnpm run cdk -- repo check kebab-groups` to confirm resolution. Execute `pnpm test` and `pnpm tsc --noEmit` to verify functional and type correctness.
5. **Deployment:** Commit changes, open PR, request reviews from CLI and Keys team leads. Merge after CI passes. No runtime rollout or version bump required as changes are purely structural and backward-compatible.

## Open Questions

- Should the new `keystore` modules be placed directly in `commands/` or moved to a dedicated `keystore/` subdirectory to better reflect their cross-cutting nature?
- Are there any third-party or external consumers of the `signer-session` exports that require a deprecation cycle before renaming?
- Should the lint pipeline threshold for file lines be adjusted post-refactoring, or is the current threshold appropriate for CLI command files?
