## Context

The `pi-agent` module currently fails CI validation due to two distinct issues: a test assertion failure where the model policies configuration is missing the `approvalMode` field, and a structural linting warning caused by `repo*.ts` files in `pi-agent/src/commands` not adhering to the project-wide kebab-case naming convention. The shared runtime API expects a consistent policy contract, and the test suite explicitly validates this structure. Additionally, the build pipeline enforces strict file naming to maintain module resolution consistency. This design outlines the approach to align the configuration with test expectations and refactor the file structure without disrupting existing runtime behavior or cross-module dependencies.

## Goals / Non-Goals

**Goals:**
- Inject `approvalMode: defer` into the pi-agent model policies configuration to satisfy the failing test assertion.
- Rename all `repo*.ts` files in `pi-agent/src/commands` to kebab-case and update all internal imports, barrel exports, and dynamic references.
- Achieve a passing CI state (9/9 checks passed, 0 warnings, 0 errors) via `pnpm run test`.

**Non-Goals:**
- Refactoring the broader pi-agent architecture or command routing logic.
- Modifying the actual behavior or data flow of the model policies beyond adding the required configuration field.
- Addressing linting or test failures in other services or modules.
- Changing the shared runtime API contract or introducing new external dependencies.

## Decisions

**1. Configuration Injection for `approvalMode`**
- **Decision:** Add `"approvalMode": "defer"` directly to the existing model policies object in the pi-agent configuration file.
- **Rationale:** The test signal explicitly expects this key-value pair. Direct injection aligns with the current configuration pattern and avoids creating a separate policy override file, which would add unnecessary indirection. The `defer` mode is semantically appropriate for the agent's current execution context, deferring approval until explicit runtime validation.
- **Alternatives Considered:** 
  - Creating a dedicated `policy-overrides.json` file: Rejected as it fragments configuration and complicates the build pipeline.
  - Modifying the test to ignore the field: Rejected as it masks a genuine contract mismatch between the agent and the runtime API.

**2. Kebab-Case File Refactoring**
- **Decision:** Systematically rename `repo*.ts` files to kebab-case (e.g., `repo-list.ts`, `repo-create.ts`) and update all import paths, including barrel exports (`index.ts`) and any string-based module resolutions.
- **Rationale:** Enforces project-wide structural consistency and satisfies the linting rule. TypeScript's module resolution is path-sensitive, so updating imports ensures the build remains stable. Using IDE refactoring tools minimizes human error.
- **Alternatives Considered:**
  - Disabling the lint rule: Rejected as it reduces long-term codebase maintainability and violates architectural standards.
  - Creating a symlink or alias: Rejected as it obscures the actual file structure and complicates debugging.

**3. Validation Strategy**
- **Decision:** Run `pnpm run test` locally with verbose output before committing, and verify that the test suite explicitly asserts the presence of `approvalMode` in the policy object.
- **Rationale:** Catches regressions early and ensures the fix is robust against future configuration drift. Local validation mirrors the CI environment, reducing feedback loops.

## Risks / Trade-offs

[Risk] Breaking changes if other modules or external consumers import the renamed `repo*.ts` files. → [Mitigation] Perform a repository-wide search for imports referencing the old filenames. Update all references systematically and run the full integration test suite before merging.

[Risk] `approvalMode: defer` might alter runtime execution flow unexpectedly. → [Mitigation] Verify the field against the shared runtime API documentation. Add a targeted unit test that asserts the policy structure and confirms the agent initializes without throwing configuration errors.

[Trade-off] Slight increase in configuration verbosity vs. strict linting compliance. → [Mitigation] Compliance ensures long-term maintainability, predictable module resolution, and stable CI pipelines. The verbosity is minimal and self-documenting.

## Migration Plan

1. **Identify & Rename Files:** Locate all `repo*.ts` files in `pi-agent/src/commands`. Rename them to kebab-case equivalents.
2. **Update Imports:** Update all internal imports, barrel exports (`index.ts`), and any dynamic `import()` statements to reference the new kebab-case paths.
3. **Apply Configuration Fix:** Open the pi-agent model policies configuration file. Add `"approvalMode": "defer"` to the policy object, ensuring correct JSON/TypeScript syntax.
4. **Local Validation:** Execute `pnpm run test` to verify all 9 checks pass, 0 warnings, and 0 errors. Review console output for any residual import resolution issues.
5. **Commit & Push:** Stage changes, commit with a descriptive message referencing the change title, and push to trigger CI.
6. **Rollback Strategy:** If CI fails or runtime behavior deviates, revert the commit using `git revert`. The rollback restores the previous configuration and file structure without data loss.

## Open Questions

- Does `approvalMode: defer` require corresponding adjustments in the shared runtime API consumer logic, or is it purely a declarative configuration flag?
- Are there any build-time scripts, Webpack/Vite aliases, or string-based module loaders that reference the old `repo*.ts` filenames and need manual updating?
- Should the `approvalMode` field be documented in the pi-agent configuration schema or TypeScript interfaces to prevent future drift?
