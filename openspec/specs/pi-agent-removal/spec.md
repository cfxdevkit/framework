# PI Agent Removal Specification

## Purpose

The `@cfxdevkit/pi-agent` package (`repos/cfx-tools/infra/pi-agent/`) AND `@cfxdevkit/pi-extensions` package (`repos/cfx-tools/infra/pi-extensions/`) SHALL be removed after their functionality is migrated to `@cfxdevkit/pi-customization` (the new pi package) and `@cfxdevkit/llm-agents` (direct imports). The ENTIRE `.pi/` directory SHALL be removed from the repo.

## Requirements

### Requirement: `@cfxdevkit/pi-agent` package IS removed

The directory `repos/cfx-tools/infra/pi-agent/` SHALL NOT exist after the change.

#### Scenario: pi-agent directory is removed

- **WHEN** `ls repos/cfx-tools/infra/pi-agent/` is run
- **THEN** the directory does NOT exist

#### Scenario: pi-agent package.json IS removed

- **WHEN** searching for `pi-agent` package.json files
- **THEN** no package.json has `"name": "@cfxdevkit/pi-agent"`

#### Scenario: pi-agent IS removed from pnpm-workspace.yaml

- **WHEN** `pnpm-workspace.yaml` is loaded
- **THEN** it does NOT include `repos/cfx-tools/infra/pi-agent`

#### Scenario: pi-agent IS removed from moon.yml project references

- **WHEN** checking moon project configurations
- **THEN** no project depends on `pi-agent`
- **THEN** no moon.yml references `pi-agent` as a dependency

### Requirement: `@cfxdevkit/pi-extensions` package IS removed

The directory `repos/cfx-tools/infra/pi-extensions/` SHALL NOT exist after the change.

#### Scenario: pi-extensions directory is removed

- **WHEN** `ls repos/cfx-tools/infra/pi-extensions/` is run
- **THEN** the directory does NOT exist

#### Scenario: pi-extensions package.json IS removed

- **WHEN** searching for `pi-extensions` package.json files
- **THEN** no package.json has `"name": "@cfxdevkit/pi-extensions"`

#### Scenario: pi-extensions IS removed from pnpm-workspace.yaml

- **WHEN** `pnpm-workspace.yaml` is loaded
- **THEN** it does NOT include `repos/cfx-tools/infra/pi-extensions`

### Requirement: `cdk agent` command IS removed from tooling-cli

- **WHEN** `cdk agent --help` is run
- **THEN** it returns "command not found" or "deprecated"
- **WHEN** `cdk agent interactive` is run
- **THEN** it returns "command not found"
- **WHEN** `cdk agent commit` is run
- **THEN** it returns "command not found"

#### Scenario: tooling-cli bin.ts DOES NOT register agent commands

- **WHEN** `tooling-cli/src/bin.ts` is loaded
- **THEN** it does NOT register `agent` subcommand
- **THEN** it does NOT import from pi-agent

#### Scenario: tooling-cli agent-session directory IS removed

- **WHEN** `ls repos/cfx-tools/infra/tooling-cli/src/agent-session/` is run
- **THEN** the directory does NOT exist
- **THEN** `setup.ts` and `setup.test.ts` are removed

#### Scenario: tooling-cli scripts ARE updated

- **WHEN** `tooling-cli/package.json` is loaded
- **THEN** it does NOT have `"agent"` or `"agent-commit"` scripts

### Requirement: Packages that depended on pi-agent ARE updated

`@cfxdevkit/llm-agents` and `@cfxdevkit/tooling-cli` SHALL NOT depend on `@cfxdevkit/pi-agent`.

#### Scenario: llm-agents package.json IS updated

- **WHEN** `repos/cfx-tools/infra/llm-agents/package.json` is loaded
- **THEN** it does NOT list `@cfxdevkit/pi-agent` in dependencies
- **THEN** it imports directly from `@earendil-works/pi-coding-agent` where needed

#### Scenario: tooling-cli package.json IS updated

- **WHEN** `repos/cfx-tools/infra/tooling-cli/package.json` is loaded
- **THEN** it does NOT list `@cfxdevkit/pi-agent` in dependencies
- **THEN** `cdk agent` command is removed from its bin namespace

### Requirement: llm-agents imports ARE updated

`@cfxdevkit/llm-agents` previously imported from `@cfxdevkit/pi-agent` for provider utilities SHALL import directly.

#### Scenario: llm-agents does NOT import from pi-agent

- **WHEN** checking all imports in `llm-agents/src/`
- **THEN** no import path contains `@cfxdevkit/pi-agent`
- **THEN** no import path contains `pi-agent/src/`

#### Scenario: llm-agents imports PI directly where needed

- **WHEN** checking `llm-agents/src/` for PI imports
- **THEN** imports use `@earendil-works/pi-coding-agent` package name
- **THEN** imports use relative paths within `llm-agents/` (not via pi-agent)

### Requirement: pi-agent dist directory IS removed

- **WHEN** `ls repos/cfx-tools/infra/pi-agent/dist/` is run
- **THEN** the directory does NOT exist
- **THEN** no build artifacts reference pi-agent

### Requirement: pi-agent CHANGELOG IS archived

- **WHEN** `repos/cfx-tools/infra/pi-agent/CHANGELOG.md` is examined
- **THEN** its key entries are preserved in this change's history
- **THEN** the file is removed with the package

### Requirement: pi-agent moon.yml IS removed

- **WHEN** checking for `pi-agent` in moon project configs
- **THEN** no moon.yml references pi-agent

### Requirement: ENTIRE `.pi/` DIRECTORY IS REMOVED FROM REPO

- **WHEN** `ls -la .pi/` is run from the repo root
- **THEN** the directory does NOT exist
- **WHEN** `git ls-files .pi/` is run
- **THEN** no files are tracked under `.pi/`

#### Scenario: .pi/settings.json IS removed

- **WHEN** `ls .pi/settings.json` is run
- **THEN** the file does NOT exist

#### Scenario: .pi/providers.json IS removed

- **WHEN** `ls .pi/providers.json` is run
- **THEN** the file does NOT exist

#### Scenario: .pi/skills/ IS removed

- **WHEN** `ls .pi/skills/` is run
- **THEN** the directory does NOT exist

#### Scenario: .pi/prompts/ IS removed

- **WHEN** `ls .pi/prompts/` is run
- **THEN** the directory does NOT exist

#### Scenario: .pi/npm/ IS removed

- **WHEN** `ls .pi/npm/` is run
- **THEN** the directory does NOT exist

#### Scenario: .pi/agent/ IS removed

- **WHEN** `ls .pi/agent/` is run
- **THEN** the directory does NOT exist

#### Scenario: .pi/extensions/ IS removed

- **WHEN** `ls .pi/extensions/` is run
- **THEN** the directory does NOT exist

#### Scenario: .pi/SETUP.md IS removed

- **WHEN** `ls .pi/SETUP.md` is run
- **THEN** the file does NOT exist

#### Scenario: .pi/web-search.json IS removed

- **WHEN** `ls .pi/web-search.json` is run
- **THEN** the file does NOT exist
