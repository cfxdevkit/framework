## MODIFIED Requirements

### Requirement: Agent actions SHALL support profile-based model policies

**MODIFIED** — the `actions` map in `providers.json` IS NOW POPULATED with a three-tier routing policy. The first concrete binding is action-name → model-ID (not yet profile-based); full profile switching remains deferred.

**Updated requirement text:**

The system SHALL support mapping agent actions to model identifiers so different work categories use different models by default. The `actions` map (string key → model ID) is the first-class binding; `providerProfiles` + profile selection is the future extension.

#### Scenario: Documentation upkeep uses the coding tier model
- **WHEN** the policy registry maps `docs-api`, `readme-upkeep`, `package-pages`, `structure-upkeep`, or `docs-upkeep` to `Qwen3-Coder-Next-GGUF`
- **THEN** the runtime SHALL select that model by default for those actions

#### Scenario: High-reasoning actions use the 122B model
- **WHEN** the policy registry maps `review`, `commit`, `changeset`, `release-readiness`, `ci-cd`, `docs-pipeline`, `repo-health`, or `test-audit` to `Qwen3.5-122B-A10B-GGUF-Q4_K_M`
- **THEN** the runtime SHALL select that model by default for those actions

#### Scenario: Lightweight actions use the always-hot small model
- **WHEN** the policy registry maps `validation` to `Gemma-4-26B-A4B-it-GGUF`
- **THEN** the runtime SHALL select that model by default for the action

#### Scenario: No action policy configured falls back to defaultModel (unchanged)
- **WHEN** an action executes without a matching entry in the `actions` map
- **THEN** the runtime SHALL use the current repo-default provider/model resolution path
