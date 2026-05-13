## ADDED Requirements

### Requirement: arch-check package exists at repos/cfx-tools/packages/arch-check/
The `@cfxdevkit/arch-check` package SHALL exist at `repos/cfx-tools/packages/arch-check/`. It SHALL be `private: true` (not published). It SHALL have `@cfxdevkit/arch-rules` as a devDependency.

#### Scenario: Package is present and private
- **WHEN** `repos/cfx-tools/packages/arch-check/package.json` is read
- **THEN** `name` is `@cfxdevkit/arch-check`, `private` is `true`

#### Scenario: arch-rules is a devDependency
- **WHEN** `repos/cfx-tools/packages/arch-check/package.json` is read
- **THEN** `devDependencies` contains `@cfxdevkit/arch-rules` with `workspace:*`

---

### Requirement: arch-check is registered in workspace and moon
`@cfxdevkit/arch-check` SHALL be a first-class workspace member, buildable and checkable via moon.

#### Scenario: Package is listed in pnpm-workspace.yaml
- **WHEN** `pnpm-workspace.yaml` is read
- **THEN** it contains a pattern matching `repos/cfx-tools/packages/*`

#### Scenario: Package is listed in .moon/workspace.yml
- **WHEN** `.moon/workspace.yml` is read
- **THEN** it contains an entry for `repos/cfx-tools/packages/arch-check`

#### Scenario: moon build task succeeds
- **WHEN** `moon run arch-check:build` is executed
- **THEN** it exits with code 0

---

### Requirement: check:secrets moon task scans for secret leaks
The `check-secrets` moon task in `arch-check` SHALL scan `repos/`, `projects/`, and `scripts/` for patterns that could expose secrets. It SHALL NOT scan the deleted `tools/` directory. It SHALL exit with code 1 if any violations are found.

#### Scenario: No violations exits 0
- **WHEN** `moon run arch-check:check-secrets` is executed in a clean repository
- **THEN** it exits with code 0

#### Scenario: Violations exit 1
- **WHEN** a file matching a security rule pattern is found during the scan
- **THEN** the task exits with code 1 and prints the violating file and line number

#### Scenario: tools/ directory is not scanned
- **WHEN** `moon run arch-check:check-secrets` is executed
- **THEN** it does not attempt to scan `tools/` (which no longer exists) and does not throw a directory-not-found error

---

### Requirement: check:hotspots moon task identifies large and frequently-changed files
The `check-hotspots` moon task SHALL analyse file sizes and git churn to identify hotspot files. It SHALL exit with code 1 when files exceed the hard limit and `--fail-on-hard` is in effect.

#### Scenario: Task completes without error in clean state
- **WHEN** `moon run arch-check:check-hotspots` is executed
- **THEN** it exits with code 0 or 1 (based on current file states) and does not throw an uncaught exception

#### Scenario: JSON report is written
- **WHEN** `moon run arch-check:check-hotspots` is executed
- **THEN** a JSON report is written under `artifacts/llm/reports/`

---

### Requirement: check:ci moon task validates CI/CD file presence
The `check-ci` moon task SHALL verify that all required CI/CD workflow and deployment files exist. It SHALL exit with code 1 if any required file is absent.

#### Scenario: Required CI files present
- **WHEN** all required CI/CD files exist in the repository
- **THEN** `moon run arch-check:check-ci` exits with code 0

#### Scenario: Missing file exits 1
- **WHEN** a required CI/CD file is absent
- **THEN** `moon run arch-check:check-ci` exits with code 1 and reports the missing file

---

### Requirement: check:docs moon task validates documentation structure
The `check-docs` moon task SHALL verify documentation conventions (README presence, STRUCTURE.md presence, changelog presence for public packages).

#### Scenario: Docs check completes
- **WHEN** `moon run arch-check:check-docs` is executed
- **THEN** it exits with code 0 or 1 and does not throw an uncaught exception

---

### Requirement: check:corpus moon task validates corpus metadata
The `check-corpus` moon task SHALL produce corpus metadata output under `artifacts/llm/corpus/` describing monorepo packages.

#### Scenario: Corpus output is written
- **WHEN** `moon run arch-check:check-corpus` is executed
- **THEN** it exits with code 0 and writes at least one file under `artifacts/llm/corpus/`

---

### Requirement: check:eval moon task validates eval gate
The `check-eval` moon task SHALL check whether eval/serve-check gate conditions are met.

#### Scenario: Eval check completes
- **WHEN** `moon run arch-check:check-eval` is executed
- **THEN** it exits with code 0 or 1 and does not throw an uncaught exception

---

### Requirement: arch:check moon task validates tier boundaries and layout rules
The `arch-check` moon task SHALL use `@cfxdevkit/arch-rules` to validate that the repository's package layout and tier structure comply with all rules whose `enforce` is `always`. It SHALL exit with code 1 if any `severity: error` rule is violated.

#### Scenario: Clean repository passes
- **WHEN** `moon run arch-check:arch-check` is executed on a repository that conforms to all `enforce: always` rules
- **THEN** it exits with code 0

#### Scenario: on-release rules are not enforced in pre-release lifecycle
- **WHEN** `getLifecycle()` returns `pre-release`
- **THEN** rules with `enforce: on-release` are skipped by `arch:check`

#### Scenario: Tier violation causes non-zero exit
- **WHEN** a lower-tier package imports a higher-tier package in violation of an `enforce: always` rule
- **THEN** `moon run arch-check:arch-check` exits with code 1 and reports the violating package and rule ID

---

### Requirement: Root package.json uses check:* prefix for deterministic checks
The root `package.json` SHALL contain `check:hotspots`, `check:secrets`, `check:ci`, `check:docs`, `check:corpus`, `check:eval`, and `arch:check` scripts that delegate to the corresponding `arch-check` moon tasks. The deprecated `quality:hotspots` and `security:secrets` scripts SHALL be removed.

#### Scenario: check:hotspots script exists
- **WHEN** the root `package.json` is read
- **THEN** it contains a `check:hotspots` script and does NOT contain `quality:hotspots`

#### Scenario: check:secrets script exists
- **WHEN** the root `package.json` is read
- **THEN** it contains a `check:secrets` script and does NOT contain `security:secrets`

#### Scenario: arch:check script exists
- **WHEN** the root `package.json` is read
- **THEN** it contains an `arch:check` script

---

### Requirement: scripts/check-secret-leaks.mjs is deleted
`scripts/check-secret-leaks.mjs` SHALL be absent from the repository after this change is applied.

#### Scenario: File is absent
- **WHEN** `ls scripts/check-secret-leaks.mjs` is executed
- **THEN** it exits with a non-zero code (file not found)

---

### Requirement: llm-tools workers for absorbed checks are removed
`repos/cfx-llm/packages/llm-tools/workers/code-hotspots.ts` and the `workers/agents/` files for deterministic checks (`cicd.ts`, `docs.ts`, `corpus.ts`, `eval-serve.ts`) SHALL be absent from `llm-tools` after this change. The `llm-agents.ts` dispatch table SHALL not contain the `ci`, `corpus`, `docs`, `eval`, `serve-check` commands.

#### Scenario: code-hotspots.ts is absent from llm-tools
- **WHEN** `ls repos/cfx-llm/packages/llm-tools/workers/code-hotspots.ts` is executed
- **THEN** it exits with a non-zero code (file not found)

#### Scenario: Absorbed agent files are absent
- **WHEN** `ls repos/cfx-llm/packages/llm-tools/workers/agents/cicd.ts` is executed
- **THEN** it exits with a non-zero code (file not found)
