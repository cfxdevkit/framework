# @cfxdevkit/arch-check

Deterministic monorepo architecture and repository health checks. Runs as part of the `cdk repo precommit` and `cdk repo commit` quality flow and can be invoked individually via `moon` or `pnpm`.

---

## Checks

### `arch-check` — Architecture rules enforcement

Validates tier dependencies, required files, and import boundaries across all packages in `repos/` and `projects/`. Rules are sourced from `@cfxdevkit/arch-rules` and applied based on each package's tier.

**Rules enforced:**
- `requires-moon-yml` — every publishable package must have a `moon.yml`
- `requires-src-index` — every publishable package must have `src/index.ts`
- `no-upward-imports` — packages may not depend on higher-tier or cross-cutting packages as runtime deps
- `no-internal-reach` — imports must go through a package's public `index.ts`, not into `src/` internals
- `file-size-hard-limit` — source files may not exceed 300 lines (generated files excluded)
- `no-ts-nocheck` — `// @ts-nocheck` is forbidden in source files
- `no-js-mjs-source-files` — source files must be TypeScript

**Generated file exclusion:** files in a `generated/` directory, named `*.generated.ts/js`, or containing `.generated.` in the filename are excluded from size and source-type checks.

### `check-hotspots` — Code size and churn analysis

Scans all source files for size and git churn. Produces a scored hotspot list to surface candidates for refactoring.

**Thresholds (defaults):**
| Threshold | Lines |
|-----------|-------|
| Soft warning | 250 |
| Hard violation | 300 |

**Options:**
```
--soft-limit <n>    Soft warning line limit (default: 250)
--hard-limit <n>    Hard violation line limit (default: 300)
--since <date>      Git churn window (default: "90 days ago")
--fail-on-hard      Exit non-zero if any hard violation exists
--json              Output raw JSON to stdout
```

**Output:** `artifacts/llm/reports/code-hotspots.{json,md}`

### `check-kebab-groups` — Grouped kebab-case sibling detection

Scans source files across the monorepo and groups sibling filenames that share a common kebab-case prefix before a final suffix segment, such as `workspace-scripts-docs.ts`, `workspace-scripts-llm.ts`, and `workspace-scripts-repo.ts`.

The intent is to surface places where repeated suffix files should likely become an explicit module directory or another clearer shape instead of growing a flat sibling cluster.

**Options:**
```
--min-group-size <n>  Minimum number of sibling files required to report a group (default: 2)
--fail-on-groups      Exit non-zero if any grouped prefix is found
--json                Output raw JSON to stdout
```

**Output:** `artifacts/llm/reports/kebab-groups.{json,md}`

### `check-secrets` — Secret pattern scanning

Scans TypeScript/JavaScript source for patterns that would expose cryptographic secrets (mnemonics, private keys, passphrases) through VS Code state, output channels, or console output.

**Rules:**
- `no-vscode-state-secret-persistence` — no secret material in `workspaceState.update`
- `no-secret-output-channel` — no secret material in `appendLine` calls
- `no-secret-console-output` — no secret material in `console.log/info/warn/error`
- `no-recovery-mnemonic-output-label` — no "Recovery mnemonic" labels in output
- `no-hardcoded-api-key` — no assignment of `apiKey`, `api_key`, or `API_KEY` to a string literal
- `no-hardcoded-private-key` — no assignment of `privateKey` / `private_key` to a `0x`-prefixed hex string
- `no-hardcoded-jwt` — no JWT-shaped string literals (`eyJ...`)

Scans only committed source under `repos/`, `projects/`, and `scripts/`. Ignores `node_modules`, `dist`, `coverage`, and test fixture directories.

### `check-docs` — Documentation alignment

Verifies that markdown documentation is internally consistent with the codebase:
- Broken path references in markdown files
- Stale references to removed directories
- Packages registered in `.moon/workspace.yml` but missing a `moon.yml`
- Package `exports` entries without a matching Vite config entry
- Required workspace/package documentation contracts, including normalized `STRUCTURE.md` identity

**Output:** `artifacts/llm/reports/docs-alignment.{json,md}`

### `generate-structure` — Deterministic STRUCTURE.md scaffolding

Builds a checked-in `STRUCTURE.md` skeleton for each public package from the real directory tree and package exports. The generated file uses the canonical package name and workspace path, avoiding legacy `framework/`, `platform/`, and `domains/` aliases in generated titles.

### `check-ci` — CI/CD readiness

Validates CI workflow files and infrastructure configuration for completeness and consistency.

### `check-corpus` — LLM corpus indexing

Collects source files into structured corpus bundles consumed by LLM agents for code-aware context.

**Output:** `artifacts/llm/corpus/`

### `check-eval` — LLM agent evaluation

Orchestrates evaluation runs against the LLM agent suite.

---

## Usage

### Via moon (recommended)

```bash
# Run all checks
moon run arch-check:check-secrets
moon run arch-check:check-hotspots
moon run arch-check:check-kebab-groups
moon run arch-check:check-docs
moon run arch-check:check-ci
moon run arch-check:check-corpus

# Architecture check (via llm:commit gate)
pnpm run check:arch
```

### Via pnpm (from package root)

```bash
cd repos/cfx-tools/packages/arch-check

pnpm run check:arch          # architecture rules
pnpm run check:hotspots      # size + churn
pnpm run check:kebab-groups  # grouped kebab-case sibling files
pnpm run check:secrets       # secret scanning
pnpm run check:docs          # docs alignment
pnpm run check:ci            # CI readiness
pnpm run check:corpus        # corpus indexing
pnpm run generate:structure  # deterministic STRUCTURE.md scaffolds
```

### Via repo precommit / commit

`arch-check` runs deterministically as part of the workspace `cdk repo precommit` / `cdk repo commit` quality-gate sequence. The gate wiring lives in `repos/cfx-tools/infra/llm-agents/workers/commit/gates.ts`.

---

## Output Format

Each check returns a structured result object and writes report artifacts under `artifacts/llm/reports/`.

| Artifact | Check |
|----------|-------|
| `artifacts/llm/reports/docs-alignment.json` | check-docs |
| `artifacts/llm/reports/docs-alignment.md` | check-docs |
| `artifacts/llm/reports/code-hotspots.json` | check-hotspots |
| `artifacts/llm/reports/code-hotspots.md` | check-hotspots |
| `artifacts/llm/reports/kebab-groups.json` | check-kebab-groups |
| `artifacts/llm/reports/kebab-groups.md` | check-kebab-groups |

---

## Configuration

Arch rules are defined in `@cfxdevkit/arch-rules` (`repos/cfx-meta/packages/arch-rules`). Tier assignments come from `.moon/workspace.yml` project declarations. No separate config file is needed for `arch-check` itself.

**Exemptions:** To exempt a path from `no-ts-nocheck` enforcement, add it to `sourceRuleExemptions` in `src/checks/arch.ts`.

---

## Architecture

```
src/
  bin/            CLI entry points (one per check)
  checks/         Check implementations
    arch.ts       Architecture rules (file-size, imports, required files)
    ci.ts         CI/CD readiness
    corpus.ts     LLM corpus collection
    docs.ts       Documentation alignment
    eval.ts       LLM evaluation orchestration
    hotspots.ts   Code size + churn hotspots
    kebab-groups.ts  Grouped kebab-case sibling detection
    secrets.ts    Secret pattern scanning
  runtime.ts      Shared utilities (root resolution, file I/O, report writing)
  index.ts        Public exports
```
