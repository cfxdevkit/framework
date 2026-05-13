## ADDED Requirements

### Requirement: repos/cfx-config contains all build-configuration packages
`repos/cfx-config/packages/` SHALL contain `@cfxdevkit/tsconfig`, `@cfxdevkit/biome-config`, and `@cfxdevkit/moon-config` — and ONLY those packages. No runtime code, no TypeScript source, no published packages SHALL live in cfx-config.

#### Scenario: All three packages present under repos/cfx-config
- **WHEN** `repos/cfx-config/packages/` is listed
- **THEN** it contains exactly the directories `tsconfig`, `biome-config`, and `moon-config`

#### Scenario: No source code in cfx-config packages
- **WHEN** any package directory under `repos/cfx-config/packages/` is inspected
- **THEN** it contains no `src/` directory and no `.ts` files

#### Scenario: All cfx-config packages are private
- **WHEN** any `package.json` under `repos/cfx-config/packages/` is read
- **THEN** `"private": true` is set

---

### Requirement: tools/ directory is removed from the repo root
The `tools/` directory at the repo root SHALL NOT exist after this change. All content SHALL have been either migrated to `repos/cfx-config/` or deleted (convention stubs only).

#### Scenario: tools/ directory does not exist
- **WHEN** the repository root is listed
- **THEN** no `tools/` directory is present

#### Scenario: No workspace reference to tools/ remains
- **WHEN** `pnpm-workspace.yaml` is read
- **THEN** no pattern references `tools/*` or any sub-path of `tools/`

#### Scenario: No moon project entry references tools/
- **WHEN** `.moon/workspace.yml` is read
- **THEN** no entry starts with `tools/`

---

### Requirement: All existing devDependency consumers reference the same package names
The package names `@cfxdevkit/tsconfig`, `@cfxdevkit/biome-config`, and `@cfxdevkit/moon-config` SHALL remain unchanged. No consumer `package.json` SHALL require updates to dependency names.

#### Scenario: Package names are preserved after migration
- **WHEN** `repos/cfx-config/packages/tsconfig/package.json` is read
- **THEN** `name` is `@cfxdevkit/tsconfig`
- **WHEN** `repos/cfx-config/packages/biome-config/package.json` is read
- **THEN** `name` is `@cfxdevkit/biome-config`
- **WHEN** `repos/cfx-config/packages/moon-config/package.json` is read
- **THEN** `name` is `@cfxdevkit/moon-config`

---

### Requirement: tsconfig.json extends paths are valid after migration
All `tsconfig.json` files in the workspace that extend from the moved tsconfig package SHALL resolve correctly. No TypeScript compilation errors SHALL be introduced by the migration.

#### Scenario: tsc --noEmit passes workspace-wide after migration
- **WHEN** `pnpm run typecheck` is executed at the workspace root after migration
- **THEN** it exits with code 0

---

### Requirement: cfx-config repo is registered in workspace and moon
`repos/cfx-config/` SHALL follow the same structural conventions as other `repos/cfx-*` entries.

#### Scenario: cfx-config packages listed in pnpm-workspace.yaml
- **WHEN** `pnpm-workspace.yaml` is read
- **THEN** it contains a pattern matching `repos/cfx-config/packages/*`

#### Scenario: cfx-config packages listed in .moon/workspace.yml
- **WHEN** `.moon/workspace.yml` is read
- **THEN** it contains entries for `repos/cfx-config/packages/tsconfig`, `repos/cfx-config/packages/biome-config`, and `repos/cfx-config/packages/moon-config`

#### Scenario: cfx-config repo root has standard files
- **WHEN** `repos/cfx-config/` is listed
- **THEN** it contains `README.md`, `CHANGELOG.md`, and `package.json`
