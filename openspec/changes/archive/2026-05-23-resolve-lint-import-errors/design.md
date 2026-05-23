## Context

The `repo-check` command module (`cdk-repo-check`) currently fails lint and check phases due to unresolved import errors. Specifically, the module attempts to import `runStructuredRepoCommand`, `findWorkspaceRoot`, `getGitNexusSnapshot`, and `writeJson` from `./commands.js` and `./context.js`, but these symbols are either missing, misnamed, or the modules themselves are not exporting them correctly. This results in a cascading failure across the lint and check pipelines, blocking validation of the repository structure and related checks (e.g., hotspots, kebab groups).

The current state shows:
- 3/8 checks passed
- 1 warning
- 4 errors (3 lint, 1 check)

The errors are reproducible via `pnpm run lint` and `pnpm run check`, and are cached in the CI pipeline (commits `80f22258` and `d6cbf64f`). The root cause is likely a mismatch between declared imports and actual exports in the local module graph, possibly due to refactoring, renaming, or incomplete migration of utilities.

Stakeholders include developers relying on `repo-check` for repository health validation, CI/CD maintainers, and contributors working on structured command infrastructure.

## Goals / Non-Goals

**Goals:**
- Resolve all lint and check errors in `cdk-repo-check` by ensuring all imports resolve to valid, exported symbols.
- Restore correct module resolution for `./commands.js` and `./context.js` without breaking existing functionality.
- Preserve the intended behavior of `repo-check` (e.g., running structured checks, detecting workspace roots, fetching Git snapshots, writing JSON outputs).
- Ensure the fix is minimal, focused, and does not introduce new dependencies or architectural changes.

**Non-Goals:**
- Refactoring or redesigning the module structure beyond what is necessary to fix the import errors.
- Adding new features or expanding the scope of `repo-check`.
- Modifying the behavior of imported utilities (e.g., changing signatures or semantics of `findWorkspaceRoot`).
- Updating or replacing `commands.js` or `context.js` unless strictly required to fix the import mismatch.

## Decisions

### 1. Audit Local Module Exports First
**Decision:** Before modifying imports, inspect `commands.js` and `context.js` to verify what they actually export.

**Rationale:** The errors suggest a mismatch between declared and actual exports. It’s more efficient and safer to align imports with existing exports than to refactor the modules themselves. This avoids unintended side effects and preserves stability.

**Alternative considered:** Rewriting `commands.js`/`context.js` to match expected exports. *Rejected* due to higher risk, scope creep, and potential for breaking other consumers.

### 2. Prefer Relative Imports Over Re-exports (if needed)
**Decision:** If `context.js` or `commands.js` are missing exports, add them directly rather than introducing re-export layers (e.g., `index.js`).

**Rationale:** Simpler module graph reduces cognitive load and avoids circular dependencies. Re-exports can obscure where symbols originate and complicate debugging.

### 3. Preserve Existing Import Syntax
**Decision:** Keep the current import style (`import { X } from './module.js'`) rather than switching to `import * as` or dynamic imports.

**Rationale:** Maintains consistency with the rest of the codebase and avoids introducing new patterns that could confuse future maintainers or trigger additional lint rules.

### 4. Validate with `pnpm run lint` and `pnpm run check` Post-Fix
**Decision:** Treat lint and check as the canonical validation gates for this change.

**Rationale:** These commands are already failing and represent the minimal reproducible test case. Success here confirms the fix is complete and non-regressive.

## Risks / Trade-offs

- **[Risk]** Over-correction: Adding exports to `context.js`/`commands.js` that were intentionally omitted (e.g., for encapsulation) may expose internal APIs.  
  → **Mitigation:** Audit usage of each symbol across the codebase before adding exports; consult git history or comments for intent.

- **[Risk]** Temporary duplication: If exports are added to both `commands.js` and `context.js`, it may create redundancy if the original split was intentional.  
  → **Mitigation:** Document the rationale for each export location; plan a follow-up cleanup if duplication persists.

- **[Risk]** CI cache invalidation: Fixing imports may invalidate cached CI steps, slowing PR validation.  
  → **Mitigation:** Ensure the fix is small and deterministic; verify cache keys are not tied to file hashes of unrelated modules.

- **[Risk]** Silent failure if `writeJson` or `getGitNexusSnapshot` are misnamed or deprecated.  
  → **Mitigation:** Cross-reference with `cdk-core` or `cdk-utils` to confirm symbol names and signatures.

## Migration Plan

1. **Audit Phase (Local)**
   - Run `grep -r "export" commands.js context.js` to list all exports.
   - Compare against the failing imports in `repo-check/index.js`.
   - Identify missing or misnamed exports.

2. **Fix Phase (Local)**
   - Add missing exports to `commands.js`/`context.js` (e.g., `export { findWorkspaceRoot }`).
   - If symbols are renamed (e.g., `getGitNexusSnapshot` → `getSnapshot`), update imports to match.
   - If modules are missing entirely, restore them from git history or refactor imports to use existing utilities.

3. **Validation Phase (Local + CI)**
   - Run `pnpm run lint` and `pnpm run check` locally.
   - Commit changes and open a PR.
   - Confirm CI passes all 8 checks with no errors.

4. **Rollback Strategy**
   - If CI fails post-merge, revert the commit.
   - No database or config migrations are involved; rollback is purely code-based.

## Open Questions

- Are `findWorkspaceRoot`, `getGitNexusSnapshot`, and `writeJson` intended to be part of `context.js`, or should they live in a shared `utils.js`?
- Is `runStructuredRepoCommand` still used elsewhere? If not, should it be deprecated or removed entirely?
- Should `repo-check` be refactored to use a shared command registry instead of importing per-module functions?  
  *(Note: This is out of scope for this remediation but worth noting for future planning.)*
