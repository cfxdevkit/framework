# monorepo-llm-setup-doc Specification

## Purpose

`.pi/SETUP.md` is the single living reference for the hardware environment, Lemonade endpoint, model catalog, task-tier rationale, and token budget policy. It answers: "what runs on this machine, what is each model for, and how do I reconfigure?"

## Requirements

### Requirement: `.pi/SETUP.md` SHALL exist and declare the hardware environment

`.pi/SETUP.md` SHALL document the host hardware (CPU/APU, RAM, storage tier) and the Lemonade endpoint URL.

#### Scenario: New contributor reads setup
- **WHEN** a contributor opens `.pi/SETUP.md`
- **THEN** they SHALL find the hardware spec, Lemonade endpoint, and a summary of why those values are set in `providers.json`

---

### Requirement: `.pi/SETUP.md` SHALL document every model in the catalog with its tier, tasks, and context window

For each model assigned to a tier, `.pi/SETUP.md` SHALL list: model ID, tier number, context window (tokens), size (GB), key labels, assigned actions, and a one-line rationale.

#### Scenario: Understanding why a model is assigned to an action
- **WHEN** a maintainer reads the tier section for a model
- **THEN** they SHALL find the assigned actions and a sentence explaining why that model handles that tier

---

### Requirement: `.pi/SETUP.md` SHALL document the token budget policy and link to `providers.json`

The document SHALL explain `contextFraction`, `cap`, `quick`, and `cloudFallback` with concrete examples for the declared hardware. It SHALL reference `providers.json` as the machine-readable source.

#### Scenario: Reconfiguring for laptop hardware
- **WHEN** a contributor reads the reconfiguration section
- **THEN** they SHALL find example `tokenBudget` values for constrained hardware (16GB, cloud)

---

### Requirement: `.pi/SETUP.md` SHALL document the cloud fallback path

The document SHALL describe how to switch to GitHub Models (`github-models` provider) when running without local hardware, including what `cloudFallback` budget value to use.

#### Scenario: CI or remote contributor without Lemonade
- **WHEN** a contributor reads the cloud fallback section
- **THEN** they SHALL find the provider type, required env vars, and recommended `tokenBudget.cloudFallback` value

---

### Requirement: The legacy config files SHALL be removed

`artifacts/llm/config/llm.json` and `artifacts/llm/config/lemonade.json` SHALL not exist. `.pi/providers.json` SHALL be the only config file read by `loadBaseConfig()`.

#### Scenario: Config resolution is unambiguous
- **WHEN** `loadBaseConfig()` runs
- **THEN** it SHALL find `.pi/providers.json` on the first try; no stale fallback files SHALL exist
