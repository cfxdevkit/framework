# consolidate-kebab-groups Specification

## Purpose
TBD - created by archiving change consolidate-kebab-groups. Update Purpose after archive.
## Requirements
### Requirement: Consolidate kebab-case file groups
The system SHALL consolidate related kebab-case file groups into single cohesive modules to reduce file sprawl and improve module cohesion across tooling-cli, arch-check, llm-agents, pi-agent, and react-ui packages.

#### Scenario: Consolidate agent files in tooling-cli
- **WHEN** the kebab-group `agent*.ts` in `repos/cfx-tools/infra/tooling-cli/src` is processed
- **THEN** files `agent-config.ts`, `agent-endpoint.ts`, `agent-help.ts`, `agent-merge.test.ts`, `agent-merge.ts`, `agent-namespace.config.test.ts`, `agent-namespace.runtime.test.ts`, `agent-namespace.ts`, and `agent-runtime.ts` are consolidated into a single `agent.ts` module

#### Scenario: Consolidate check files in arch-check
- **WHEN** the kebab-group `check*.ts` in `repos/cfx-tools/packages/arch-check/src/bin` is processed
- **THEN** files `check-ci.ts`, `check-corpus.ts`, `check-docs.ts`, `check-eval.ts`, `check-hotspots.ts`, `check-report.ts`, and `check-secrets.ts` are consolidated into a single `check.ts` module

#### Scenario: Consolidate api files in llm-agents
- **WHEN** the kebab-group `api*.ts` in `repos/cfx-tools/infra/llm-agents/workers/docs` is processed
- **THEN** files `api-enrichment.test.ts`, `api-enrichment.ts`, `api-flags.ts`, `api-probe.test.ts`, and `api-probe.ts` are consolidated into a single `api.ts` module

#### Scenario: Consolidate config files in pi-agent
- **WHEN** the kebab-group `config*.ts` in `repos/cfx-tools/infra/pi-agent/src` is processed
- **THEN** files `config-normalize.ts`, `config-paths.ts`, `config-policy.ts`, `config-storage.ts`, and `config-types.ts` are consolidated into a single `config.ts` module

#### Scenario: Consolidate keystore files in react-ui
- **WHEN** the kebab-group `use-keystore*.ts` in `repos/cfx-ui/packages/react/src/keystore` is processed
- **THEN** files `use-keystore-accounts.ts`, `use-keystore-identity.ts`, `use-keystore-lifecycle.ts`, `use-keystore-mutations.ts`, and `use-keystore-wallets.ts` are consolidated into a single `use-keystore.ts` module

