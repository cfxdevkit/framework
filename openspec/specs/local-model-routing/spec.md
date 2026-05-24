# local-model-routing Specification

## Purpose

Define a three-tier action-to-model routing policy for the local Lemonade stack. Each agent action is assigned to the smallest model capable of completing it well, keeping lightweight tasks on an always-hot model, documentation churn on the coding model, and high-reasoning tasks on the largest model.

## Requirements

### Requirement: The `actions` map SHALL route lightweight agent actions to the always-hot small model

The `providers.json` `actions` map SHALL assign the `validation` action to `Gemma-4-26B-A4B-it-GGUF`.

#### Scenario: Validation action resolves to gemma4
- **WHEN** `resolveExecutionContext({ action: 'validation' })` is called
- **THEN** the resolved model SHALL be `Gemma-4-26B-A4B-it-GGUF`

#### Scenario: gemma4 is used while heavier models are occupied
- **WHEN** `Qwen3-Coder-Next-GGUF` or `Qwen3.5-122B` are loaded for another task
- **THEN** the `validation` action SHALL still resolve without triggering a model eviction

---

### Requirement: The `actions` map SHALL route documentation actions to the coding model

The `providers.json` `actions` map SHALL assign `docs-api`, `readme-upkeep`, `package-pages`, `structure-upkeep`, and `docs-upkeep` to `Qwen3-Coder-Next-GGUF`.

#### Scenario: docs-api resolves to Qwen3-Coder-Next
- **WHEN** `resolveExecutionContext({ action: 'docs-api' })` is called
- **THEN** the resolved model SHALL be `Qwen3-Coder-Next-GGUF`

#### Scenario: All doc-upkeep actions use the same tier
- **WHEN** any of `readme-upkeep`, `package-pages`, `structure-upkeep`, `docs-upkeep` is resolved
- **THEN** each SHALL resolve to `Qwen3-Coder-Next-GGUF`

---

### Requirement: The `actions` map SHALL route high-reasoning actions to the largest model

The `providers.json` `actions` map SHALL assign `review`, `commit`, `test-audit`, `repo-health`, `changeset`, `release-readiness`, `ci-cd`, and `docs-pipeline` to `Qwen3.5-122B-A10B-GGUF-Q4_K_M`.

#### Scenario: Code review resolves to Qwen3.5-122B
- **WHEN** `resolveExecutionContext({ action: 'review' })` is called
- **THEN** the resolved model SHALL be `Qwen3.5-122B-A10B-GGUF-Q4_K_M`

#### Scenario: Commit action resolves to Qwen3.5-122B
- **WHEN** `resolveExecutionContext({ action: 'commit' })` is called
- **THEN** the resolved model SHALL be `Qwen3.5-122B-A10B-GGUF-Q4_K_M`

#### Scenario: All release and CI risk actions use the reasoning tier
- **WHEN** any of `changeset`, `release-readiness`, `ci-cd`, `docs-pipeline`, `repo-health`, `test-audit` is resolved
- **THEN** each SHALL resolve to `Qwen3.5-122B-A10B-GGUF-Q4_K_M`

---

### Requirement: The `defaultModel` SHALL remain the fallback for unregistered actions

Any action not present in the `actions` map SHALL fall back to `defaultModel` (`Qwen3-Coder-Next-GGUF`).

#### Scenario: Unregistered action falls back to default
- **WHEN** `resolveExecutionContext({ action: 'unknown-action' })` is called
- **THEN** the resolved model SHALL be the configured `defaultModel`

---

### Requirement: Per-call `--model` override SHALL take precedence over the `actions` map

The `modelOverride` parameter in `resolveExecutionContext` SHALL always win over the `actions` routing.

#### Scenario: Model override bypasses routing
- **WHEN** `resolveExecutionContext({ action: 'review', modelOverride: 'Qwen3-Coder-Next-GGUF' })` is called
- **THEN** the resolved model SHALL be `Qwen3-Coder-Next-GGUF`, not the routing policy assignment

---

### Requirement: The ADR SHALL document the tier rationale and equilibrium design

`docs/adr/0004-local-llm-model-routing.md` SHALL exist and cover: context, tier definitions, model assignments, consequences, and non-goals (phase routing, provider profile switching).
