# PI Config Global Specification

## Purpose

ALL PI configuration SHALL live in `~/.pi/agent/` (global, user-level). The repo SHALL contain NO `.pi/` folder — no config, no skills, no prompts, no packages. The devcontainer post-create script SHALL create and populate `~/.pi/agent/` at build time.

## Requirements

### Requirement: `~/.pi/agent/settings.json` EXISTS and IS correct

- **WHEN** devcontainer post-create.sh completes
- **THEN** `~/.pi/agent/settings.json` exists
- **THEN** it contains the `packages` array with:
  - `"./repos/cfx-tools/infra/pi-customization"`
  - `"npm:@davecodes/pi-dcp"`
  - `"npm:pi-web-access"`
- **THEN** it does NOT contain `"cdk agent"` in any field
- **THEN** it does NOT contain `runtime.entrypoint`
- **THEN** it does NOT contain `controlPlane`

#### Scenario: settings.json is NOT overwritten if user has existing config

- **WHEN** post-create.sh runs and `~/.pi/agent/settings.json` already exists
- **THEN** the existing file is preserved
- **THEN** the pi-customization, pi-dcp, and pi-web-access entries are added to the packages array (via `pi install`, not manual write)

### Requirement: `~/.pi/agent/providers.json` EXISTS with provider config

- **WHEN** post-create.sh completes
- **THEN** `~/.pi/agent/providers.json` exists
- **THEN** it contains:
  - `provider`: the default provider name (e.g., `"openai-compat"`)
  - `baseUrl`: the LLM endpoint (e.g., `"http://localhost:28787/v1/"`)
  - `defaultModel`: the default model name
  - `modelOverrides`: model-level overrides (merged from old `.pi/agent/models.json`)
  - `actions`: model overrides per action type (validation, commit, review, etc.)
- **THEN** it does NOT contain plaintext API keys (uses env var placeholders where needed)

#### Scenario: modelOverrides merged from old .pi/agent/models.json

- **WHEN** checking `~/.pi/agent/providers.json`
- **THEN** the `Qwen3.6-35B-A3B-MTP-GGUF-Q8_0` model override (contextWindow: 262144, maxTokens: 235929) is present

### Requirement: `~/.pi/agent/dcp.json` EXISTS

- **WHEN** post-create.sh completes
- **THEN** `~/.pi/agent/dcp.json` exists with dcp configuration

### Requirement: `~/.pi/agent/skills/` EXISTS

- **WHEN** post-create.sh completes
- **THEN** `~/.pi/agent/skills/` exists with:
  - `framework-check/` skill
  - `gitnexus/` skill
  - `openspec-apply-change/` skill
  - `openspec-archive-change/` skill
  - `openspec-explore/` skill
  - `openspec-propose/` skill
  - `repo-actions.md`
  - `pi-dcp/` (from npm package)
  - `librarian/` (from pi-web-access)

### Requirement: `~/.pi/agent/prompts/` EXISTS

- **WHEN** post-create.sh completes
- **THEN** `~/.pi/agent/prompts/` exists with:
  - `opsx-apply.md`
  - `opsx-archive.md`
  - `opsx-explore.md`
  - `opsx-propose.md`
  - `repo-system.md`

### Requirement: `~/.pi/agent/npm/` DOES NOT exist in git

- **WHEN** `git ls-files ~/.pi/agent/npm/` is run
- **THEN** no files are tracked
- **THEN** `~/.pi/agent/npm/.gitignore` exists (or npm is excluded by default)

### Requirement: `~/.pi/agent/` IS the single source of truth

- **WHEN** PI loads its configuration
- **THEN** it reads from `~/.pi/agent/` only
- **THEN** NO `.pi/` folder is checked (it doesn't exist in the repo)

### Requirement: API keys are NOT in any git-tracked file

- **WHEN** checking all git-tracked files for API key patterns
- **THEN** no file contains values matching API key patterns
- **THEN** `~/.pi/agent/providers.json` uses env var placeholders where needed

### Requirement: `~/.pi/` directory is NOT versioned in git

- **WHEN** `git ls-files ~/.pi/` is run
- **THEN** no files are tracked
- **THEN** the `~/.pi/` directory is entirely outside the repo
