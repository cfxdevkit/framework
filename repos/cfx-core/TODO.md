# cfx-core TODO

## Structure Improvements

### 1. Add .gitignore Files
**Priority:** High  
**Status:** Done (2026-05-19)

Added `.gitignore` files to each package and to the repo root:

- `repos/cfx-core/.gitignore` — repo-level; covers `packages/*/dist/`, `packages/*/coverage/`, etc.
- `packages/{core,protocol,executor,devnode,testing}/.gitignore` — package-level; covers `dist/`, `build/`, `*.tsbuildinfo`, `coverage/`, `.vitest/`, `.vite/`, `node_modules/`.

These prepare for the ADR-0003 carve-out (standalone repo) where the root workspace `.gitignore` won't apply.

---

### 2. Tree-Shaking Optimization
**Priority:** Medium  
**Status:** Partially done (2026-05-19)

#### Done
- Added `"sideEffects": false` to all 5 package.json files. All packages are pure TypeScript; no CSS or side-effect files exist.

#### Remaining
- **Export optimization:** All subpath exports already have `types` + `import` conditions. `require` (CJS) condition and `default` fallback not yet added — add when CJS consumers are needed.
- **Bundle size verification:** No `size-limit` or bundle analyser CI check yet. Add when publishing cadence is established.

---

### 3. Build Output Cleanup
**Priority:** Medium  
**Status:** Done (2026-05-19)

- Added `"prepublishOnly": "pnpm clean"` to all 5 package.json files. Each package already had a `clean` script (`rm -rf dist .vitest coverage`), so this chains correctly.
- All packages already use the `files` field in package.json to whitelist only `dist/` and docs — no `.npmignore` needed.

#### Remaining
- CI clean-build verification (remove dist, reinstall, rebuild) not yet added to pipeline.

---

### 4. TypeScript Configuration
**Priority:** Medium  
**Status:** Partially done (2026-05-19)

#### Done
- Added path mappings to root `tsconfig.base.json` for all 5 cfx-core packages plus `/*` wildcard variants. Enables IDE go-to-definition and `tsc --noEmit` type checking against source files.

#### Already satisfied
- Strict mode is fully enabled in `repos/cfx-config/packages/tsconfig/base.json`: `strict`, `noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc.

#### Remaining
- Type completeness verification script (check all public exports have explicit types) not yet added.
- `emitDeclarationOnly` verification (current config uses `noEmit: true`; Vite's `vite-plugin-dts` handles `.d.ts` emission).

---

### 5. Documentation Improvements
**Priority:** Low  
**Status:** Pending

- Expand `executor` README (currently 374 bytes)
- Add PORTING.md to packages that lack it
- Expand `protocol` STRUCTURE.md (currently 829 bytes)

---

### 6. Workspace Template Validation
**Priority:** Low  
**Status:** Done (2026-05-19)

- Added `scripts/validate-workspace.mjs` — reads `pnpm-workspace.template.yaml`, globs the template patterns against the actual `packages/` directory, and verifies each matched directory has a `package.json`. Exits non-zero on failure.
- Added `validate:workspace` script to repo `package.json`: `node scripts/validate-workspace.mjs`.
- Run manually: `pnpm validate:workspace` from `repos/cfx-core/`.

---

### 7. Dependency Validation
**Priority:** Low  
**Status:** Done (2026-05-19)

- Added `scripts/check-deps.mjs` — discovers all packages under `packages/`, prints the runtime dependency graph (from `dependencies` only), and fails if any `workspace:*` runtime dep is not found within cfx-core. Shared tooling devDependencies (`@cfxdevkit/tsconfig`, `@cfxdevkit/biome-config`) are reported informally but do not fail the check.
- Added `validate:deps` script to repo `package.json`: `node scripts/check-deps.mjs`.
- Run manually: `pnpm validate:deps` from `repos/cfx-core/`.
- `knip` is already wired up at the monorepo root (`pnpm check:unused`) with cfx-core configured in `knip.config.ts`.

---

## Recent Changes

### 2026-05-19
- Removed `cfx-openhands/` directory (was empty, only contained `.venv/` and `artifacts/`)
- Added `.gitignore` to repo root and all 5 packages (ADR-0003 carve-out readiness)
- Added `"sideEffects": false` to all 5 package.json files (all packages are pure TypeScript)
- Added `"prepublishOnly": "pnpm clean"` to all 5 package.json files
- Added TypeScript path mappings to root `tsconfig.base.json` for all cfx-core packages
- Added `scripts/validate-workspace.mjs` + `validate:workspace` npm script
- Added `scripts/check-deps.mjs` + `validate:deps` npm script

---

## arch-check Analysis

### Current Status

**Package:** `repos/cfx-tools/packages/arch-check`  
**Purpose:** Deterministic monorepo architecture and repository health checks

**Active Checks:**
1. **arch-check** - Architecture rules enforcement (tier dependencies, file structure)
2. **check-hotspots** - Code size and churn analysis (250 soft / 300 hard line limits)
3. **check-secrets** - Secret pattern scanning (mnemonics, private keys)
4. **check-docs** - Documentation alignment (broken links, moon registration, exports)
5. **check-ci** - CI/CD readiness verification
6. **check-corpus** - LLM corpus file indexing
7. **check-eval** - LLM agent evaluation orchestration

**Current Issues Detected:**

#### Architecture Check (arch-check)
- **1 error:** `repos/cfx-ui/packages/ui-core/src/mainnet-catalog.generated.ts` has 820 lines (exceeds 300 limit)
- Note: Generated files should be excluded from size limits but currently aren't

#### Docs Check (check-docs)
- **2 errors:** Path references escaping repository in `repos/cfx-domain` and `repos/cfx-tools/packages/mcp-server`
- **38 warnings:** Broken path references including:
  - References to removed `cfx-openhands/` directory
  - Missing `docs/architecture/` files referenced from package docs
  - Non-existent subdirectories in package documentation
  - Export entries without corresponding Vite config entries

#### Hotspots Check (check-hotspots)
- **0 hard violations**
- **37 soft warnings** (files over 250 lines)
- Top hotspots:
  - `vscode-extension/src/extension.ts`: 151 lines, score 9694
  - `showcase-public` pages: 196-294 lines each
  - `cfx-core/packages/devnode/src/node.ts`: 233 lines

### Improvements Needed

#### 1. Add README.md
**Priority:** High  
**Status:** Pending

The package lacks documentation. Create README.md covering:
- Purpose and architecture of each check
- Usage instructions for CLI and moon tasks
- Output format and artifact locations
- Configuration options

#### 2. Exclude Generated Files from Size Limits
**Priority:** High  
**Status:** Pending

The `file-size-hard-limit` rule currently catches generated files like `mainnet-catalog.generated.ts`.

**Fix:** Update `arch.ts` to exclude generated files:
```typescript
// Already excluded in collectPackageSourceFiles but rule check bypasses this
// Need to apply same exclusion logic in checkSourceFiles
```

#### 3. Add Test Coverage
**Priority:** Medium  
**Status:** Pending

No test files exist for arch-check. Add tests for:
- `runtime.ts` utility functions
- Individual check implementations
- Rule enforcement logic
- Report generation

#### 4. Improve Secret Scanning
**Priority:** Medium  
**Status:** Pending

Current secret rules only cover VS Code-specific patterns. Add:
- Generic secret detection (API keys, tokens)
- `.gitignore` aware scanning
- Allowlist for known-safe patterns
- Integration with `gitleaks` or similar tools

#### 5. Enhance Hotspots Reporting
**Priority:** Medium  
**Status:** Pending

- Add trend tracking over time
- Integrate with CI to show diffs
- Add per-package budgets
- Generate visual reports (charts/graphs)

#### 6. Fix Documentation References
**Priority:** Medium  
**Status:** Pending

Update documentation to fix broken references identified by `check-docs`:
- Remove/update `cfx-openhands` references
- Create missing `docs/architecture/` files or update references
- Fix package-level documentation paths

#### 7. Add Moon.yml
**Priority:** Low  
**Status:** Pending

Package has moon.yml but no README. Add moon.yml with:
- Task dependencies
- Output artifacts declaration
- Cache configuration for non-sensitive outputs

#### 8. Expand Corpus Collection
**Priority:** Low  
**Status:** Pending

- Add support for more file types (`.graphql`, `.proto`)
- Improve chunking strategy for large files
- Add metadata extraction from files

#### 9. CI Integration
**Priority:** Low  
**Status:** Pending

- Add GitHub Actions workflow for running checks
- Configure failure thresholds
- Add artifact upload for reports
