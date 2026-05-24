# providers-catalog Specification

## Purpose

`providers.json` SHALL contain a `catalog` array that is the machine-readable counterpart to `.pi/SETUP.md`. It lists each model with its tier, assigned actions, context window, and role description. This allows tools like `cdk agent smoke` to cross-reference discovered models against the declared catalog.

## Requirements

### Requirement: `providers.json` SHALL contain a `catalog` array

`providers.json` SHALL have a top-level `catalog` key containing an array of model descriptor objects.

Each descriptor SHALL include: `id` (Lemonade model ID), `tier` (1|2|3|"unassigned"), `role` (one-line description), `assignedActions` (subset of `actions` map keys), `contextWindow` (tokens from API), `sizeGb` (optional), `labels` (from Lemonade API).

#### Scenario: Smoke test cross-references catalog
- **WHEN** `cdk agent smoke` discovers models from Lemonade
- **THEN** it SHALL optionally compare discovered model IDs against the `catalog` array and warn about any catalog entry not found in the live server

#### Scenario: Catalog entry for a reasoning-tier model
- **GIVEN** `providers.json` has a catalog entry for `Qwen3.5-122B-A10B-GGUF-Q4_K_M`
- **WHEN** the entry is read
- **THEN** it SHALL show `tier: 3`, `assignedActions: ["review","commit","changeset",...]`, and `contextWindow: 262144`

---

### Requirement: `LlmConfig` SHALL support an optional `catalog` field

The `LlmConfig` TypeScript interface SHALL include `catalog?: readonly LlmModelCatalogEntry[]`. `LlmModelCatalogEntry` SHALL be a typed interface in `types.ts`.

#### Scenario: Config normalization preserves catalog
- **WHEN** `normalizeConfig` processes a raw config with a `catalog` array
- **THEN** the normalized config SHALL include the catalog entries unchanged

---

### Requirement: `catalog` SHALL NOT affect runtime routing or token budget resolution

The `catalog` array is metadata only. `resolveMaxTokens`, `resolveProviderModel`, and all routing logic SHALL ignore the `catalog` field.

#### Scenario: Missing catalog entry does not break completion
- **WHEN** a model is used that has no catalog entry
- **THEN** completion SHALL proceed normally; no error or warning SHALL be emitted at runtime
