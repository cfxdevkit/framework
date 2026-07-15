# PI Global Install Specification

## Purpose

`pi` (the coding agent CLI) SHALL be installed globally in the devcontainer, available on PATH as `pi`. ALL PI configuration SHALL live in `~/.pi/agent/` — the repo SHALL contain NO `.pi/` folder. Repo-specific customization SHALL be delivered as a pi package (`@cfxdevkit/pi-customization`) installed globally via `pi install` (no `-l` flag).

## Requirements

### Requirement: `pi` IS available on PATH in devcontainer

The devcontainer post-create script SHALL install `pi` globally so it is available as `pi` on PATH.

#### Scenario: `pi` is available immediately after devcontainer creation

- **WHEN** devcontainer post-create.sh completes
- **THEN** `command -v pi` returns 0
- **THEN** `pi --version` outputs a valid semver

#### Scenario: PI version is pinned to workspace-compatible version

- **WHEN** `pi` is installed via post-create.sh
- **THEN** the installed version is `@earendil-works/pi-coding-agent@0.79.10`
- **THEN** `pi --version` outputs `0.79.10`

#### Scenario: PI binary is in PNPM global bin path

- **WHEN** post-create.sh installs `pi`
- **THEN** the binary is symlinked in `$PNPM_HOME` (or `$NPM_PREFIX/bin`)
- **THEN** `$PNPM_HOME` is on PATH before any other node bin directories

### Requirement: `@cfxdevkit/pi-customization` IS installed globally as a pi package

- **WHEN** post-create.sh runs
- **THEN** `pi install ./repos/cfx-tools/infra/pi-customization` succeeds
- **THEN** the package is installed in `~/.pi/agent/` (NOT `.pi/npm/`)
- **THEN** `~/.pi/agent/settings.json` contains `"./repos/cfx-tools/infra/pi-customization"` in the packages array

### Requirement: PI packages ARE installed globally (not project-local)

PI npm-based extensions SHALL be installed using PI's native extension mechanism WITHOUT the `-l` flag.

#### Scenario: pi-dcp IS installed globally

- **WHEN** post-create.sh runs
- **THEN** `pi install npm:@davecodes/pi-dcp` (no `-l`) succeeds
- **THEN** PI loads the dcp package from `~/.pi/agent/npm/@davecodes/pi-dcp/`

#### Scenario: pi-web-access IS installed globally

- **WHEN** post-create.sh runs
- **THEN** `pi install npm:pi-web-access` (no `-l`) succeeds
- **THEN** PI loads the web-access package from `~/.pi/agent/npm/pi-web-access/`

#### Scenario: pi-gitnexus IS conditionally installed globally

- **WHEN** `pi` post-create.sh completes
- **THEN** `pi install npm:pi-gitnexus` (no `-l`) is executed
- **WHEN** the env var is NOT set
- **THEN** gitnexus is NOT installed

### Requirement: PI IS NOT a pnpm workspace dependency

PI SHALL NOT appear in any `package.json` as a dependency within the workspace.

#### Scenario: No package.json references pi-coding-agent

- **WHEN** searching all package.json files in the workspace
- **THEN** no file lists `@earendil-works/pi-coding-agent` in dependencies or devDependencies
- **THEN** no file lists `@earendil-works/pi-tui` in dependencies

#### Scenario: Root package.json does not depend on PI

- **WHEN** checking root `package.json`
- **THEN** it does not list pi-coding-agent in any dependency field

### Requirement: pi-customization package has correct peer dependencies

The `@cfxdevkit/pi-customization` package SHALL declare PI as a peer dependency.

#### Scenario: pi-customization package.json declares peer deps

- **WHEN** `repos/cfx-tools/infra/pi-customization/package.json` is loaded
- **THEN** it lists `@earendil-works/pi-coding-agent` in peerDependencies with range `"*"`
- **THEN** it lists `@earendil-works/pi-tui` in peerDependencies with range `"*"`
- **THEN** it lists `typebox` in peerDependencies with range `"*"`
- **THEN** it does NOT list these packages in `dependencies`

#### Scenario: pi-customization package.json declares keywords

- **WHEN** `repos/cfx-tools/infra/pi-customization/package.json` is loaded
- **THEN** it includes `"pi-package"` in the `keywords` array

#### Scenario: pi-customization package.json has pi manifest

- **WHEN** `repos/cfx-tools/infra/pi-customization/package.json` is loaded
- **THEN** it contains a `pi` key with `"extensions": ["./dist/index.js"]`

### Requirement: NO `.pi/` folder EXISTS in the repo

- **WHEN** `ls -la .pi/` is run from the repo root
- **THEN** the directory does NOT exist
- **WHEN** `git ls-files .pi/` is run
- **THEN** no files are tracked under `.pi/`
