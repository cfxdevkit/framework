# Changelog


## [Unreleased] - 2026-05-02
### Added
- Introduced `test-upkeep` LLM worker in `@cfxdevkit/llm-tools` to analyze test coverage, identify hotspots, and optionally generate missing test files.
### Changed
- Updated `docs-upkeep` pipeline to process folders deepest-first, enabling inner folder artifacts to serve as context for parent folders.
- Extended `generateDocsUpkeepArtifact` and `generateDocsUpkeepReplacements` with optional `childContext` parameter to incorporate child summaries.
- Added `buildChildSummaryContext` helper to accumulate and truncate child artifact summaries for LLM prompts.
- Updated README files for `devtools` and `docs-site` to clarify internal scope and warn about missing `../../docs/` path.
- Refined CLI documentation in `API.md` files to distinguish between built CLI (`cfx-llm`) and dev-time invocation via package scripts.
- Added `--skip-test-run` flag to `test-upkeep` to bypass vitest execution during analysis.
### Fixed
- Ensured deterministic ordering of discovered scopes in `docs-upkeep` and `test-upkeep` pipelines.
- Corrected prompt construction to filter empty strings before joining, reducing token waste.

## [Unreleased] - 2026-05-02
### Changed
- Migrated `workers/lemonade-cli.mjs` and `workers/llm-agents.mjs` to TypeScript (`workers/lemonade-cli.ts`, `workers/llm-agents.ts`) and updated `src/run.ts` to execute them via `tsx`.
- Updated `tsconfig.json` to include `workers/**/*` in `include` and set `rootDir` to `.` for unified TypeScript compilation.
- Modified `moon.yml` to define `fileGroups.sources` covering `src`, `workers`, `package.json`, and `tsconfig*.json`.
- Updated `package.json` to move `tsx` from `devDependencies` to `dependencies` and extended `lint` to include `workers`.
- Adjusted `README.md` to clarify `llm:docs-upkeep` behavior: replaced `--include-package-docs` with `--write`, added `--docs-only`, and clarified write-mode constraints.
- Updated `API.md` to remove 'currently' from description of `@cfxdevkit/llm-tools` capabilities.
- Updated `STRUCTURE.md` to reflect TypeScript workers and clarify that implementation resides in typed source.



## [Unreleased] - 2026-05-02
### Added
- New `llm:docs-upkeep` command that runs a four-phase documentation maintenance loop: refreshes deterministic docs alignment, discovers documentation folder scopes, processes each folder serially with bounded context, and writes per-folder artifacts plus an index report.
- CLI support for `docs-upkeep` in `lemonade-cli.mjs` with flags: `--quick`, `--scope`, `--max-folders`, `--include-package-docs`, `--model`, and free-form prompt.
- Artifact generation logic that produces structured JSON output with summary, artifactLines, and followups per folder scope.
- Folder-level upkeep reports written to `artifacts/llm/reports/docs-upkeep/` and a consolidated index at `artifacts/llm/reports/docs-upkeep.md`.
### Changed
- Updated `llmCommands` in `src/index.ts` to pass `['docs-upkeep']` instead of `['run', 'docs-upkeep']` to the worker.
- Enhanced `lemonade-cli.mjs` with new imports (`readdir`, `stat`) and full docs-upkeep pipeline implementation including file discovery, context building, LLM prompting, JSON validation, and artifact writing.
- README.md now documents the new `llm:docs-upkeep` command with usage examples and flag descriptions.

## [Unreleased] - 2026-05-02
### Added
- `llm-tools` package (`@cfxdevkit/llm-tools`) providing local Lemonade/Pi automation for docs, validation, review, and commit workflows
- CLI entrypoint (`src/bin.ts`) and runtime entrypoint (`src/index.ts`, `src/run.ts`)
- Worker modules (`workers/lemonade-cli.mjs`, `workers/llm-agents.mjs`) for isolated execution
- Package documentation (`API.md`, `README.md`, `STRUCTURE.md`) and configuration (`moon.yml`, `package.json`, `tsconfig.json`, `vite.config.ts`)
- Inclusion of `llm-tools` in root `README.md` package table


All notable changes to this package are documented here.

