# Changelog

## [Unreleased] - 2026-05-13
### Added
- Added `@cfxdevkit/llm-client` with typed provider resolution for Lemonade, OpenAI-compatible endpoints, and GitHub Models.
- Added `@cfxdevkit/llm-agents` for commit, docs, test-upkeep, and deterministic review workflows.

### Changed
- Slimmed `@cfxdevkit/llm-tools` to a CLI dispatcher that composes `llm-client` and `llm-agents`.

### Removed
- Removed the experimental Pi RPC provider path and its dependency.

## [Unreleased] - 2026-05-05
### Changed
- Increased soft file line limit from 150 to 250 and hard file line limit from 250 to 300 in `code-hotspots.ts`, `models.ts`, and `code-hotspots.json`
- Updated `README.md` to reflect the new hard limit of 300 lines in the `llm:commit` quality gate



## 2026-05-04

### Changed

- Updated repos/cfx-llm files: repos/cfx-llm/CHANGELOG.md, repos/cfx-llm/packages/llm-tools/STRUCTURE.md, repos/cfx-llm/packages/llm-tools/src/run.test.ts, repos/cfx-llm/packages/llm-tools/src/run.ts, repos/cfx-llm/packages/llm-tools/workers/agent-checks.ts, repos/cfx-llm/packages/llm-tools/workers/agent-constants.ts, repos/cfx-llm/packages/llm-tools/workers/agent-corpus.ts, repos/cfx-llm/packages/llm-tools/workers/agent-docs.ts, repos/cfx-llm/packages/llm-tools/workers/agent-models.ts, repos/cfx-llm/packages/llm-tools/workers/agent-paths.ts, repos/cfx-llm/packages/llm-tools/workers/agent-reports.ts, repos/cfx-llm/packages/llm-tools/workers/agent-runtime.ts, and 46 more.

## 2026-05-04

### Changed

- Updated repos/cfx-llm files: repos/cfx-llm/packages/llm-tools/workers/agent-checks.ts, repos/cfx-llm/packages/llm-tools/workers/agent-constants.ts, repos/cfx-llm/packages/llm-tools/workers/agent-corpus.ts, repos/cfx-llm/packages/llm-tools/workers/agent-docs.ts, repos/cfx-llm/packages/llm-tools/workers/agent-models.ts, repos/cfx-llm/packages/llm-tools/workers/agent-paths.ts, repos/cfx-llm/packages/llm-tools/workers/agent-reports.ts, repos/cfx-llm/packages/llm-tools/workers/agent-runtime.ts, repos/cfx-llm/packages/llm-tools/workers/agents/all.ts, repos/cfx-llm/packages/llm-tools/workers/agents/corpus.ts, repos/cfx-llm/packages/llm-tools/workers/agents/docs.ts, repos/cfx-llm/packages/llm-tools/workers/agents/eval-serve.ts, and 9 more.



## 2026-05-04

### Changed

- Updated repos/cfx-llm files: repos/cfx-llm/CHANGELOG.md, repos/cfx-llm/README.md, repos/cfx-llm/package.json, repos/cfx-llm/packages/llm-tools/API.md, repos/cfx-llm/packages/llm-tools/README.md, repos/cfx-llm/packages/llm-tools/STRUCTURE.md, repos/cfx-llm/packages/llm-tools/artifacts/llm/reports/code-hotspots.json, repos/cfx-llm/packages/llm-tools/artifacts/llm/reports/code-hotspots.md, repos/cfx-llm/packages/llm-tools/moon.yml, repos/cfx-llm/packages/llm-tools/package.json, repos/cfx-llm/packages/llm-tools/src/bin.ts, repos/cfx-llm/packages/llm-tools/src/index.ts, and 50 more.

## [Unreleased] - 2026-05-04
### Added
- Created the `cfx-llm` repository slice for local LLM and AI-assisted automation.
- Moved `@cfxdevkit/llm-tools` into `repos/cfx-llm/packages/llm-tools`.
- Moved code-hotspot scanning into the TypeScript `llm-tools` command surface as `llm hotspots`.

All notable changes to this package are documented here.
