# Changelog

## [Unreleased] - 2026-05-05
### Changed
- Reformatted `package.json` commands, views, viewsWelcome, and menus sections with consistent multi-line JSON formatting.
- Ensured trailing newline in `package.json` and `tsconfig.json` files.



## 2026-05-04

### Changed

- Updated repos/cfx-tools files: repos/cfx-tools/CHANGELOG.md, repos/cfx-tools/README.md, repos/cfx-tools/packages/llm-tools/API.md, repos/cfx-tools/packages/llm-tools/README.md, repos/cfx-tools/packages/llm-tools/STRUCTURE.md, repos/cfx-tools/packages/llm-tools/moon.yml, repos/cfx-tools/packages/llm-tools/package.json, repos/cfx-tools/packages/llm-tools/src/bin.ts, repos/cfx-tools/packages/llm-tools/src/index.ts, repos/cfx-tools/packages/llm-tools/src/run.ts, repos/cfx-tools/packages/llm-tools/tsconfig.json, repos/cfx-tools/packages/llm-tools/vite.config.ts, and 23 more.

## [Unreleased] - 2026-05-04
### Changed
- Moved `@cfxdevkit/llm-tools` out to the new `repos/cfx-llm` slice.
- Updated package documentation so `cfx-tools` owns general developer tooling while `cfx-llm` owns local LLM automation.


## [Unreleased] - 2026-05-02
### Changed
- **lemonade-cli.ts**: Clarified that `--skip-tests` applies only when `withTests` is enabled (default), and updated fallback artifact messages for clarity.
- **lemonade-cli.ts**: Added logic to detect non-directory paths in scope resolution to prevent invalid changelog directory creation.
- **scaffold-cli**: Updated template discovery path from `../templates/` to `../../templates/` and corrected API.md architecture reference path.
- **devtools/README.md**: Updated `devkit-server/` description to use 'Node.js' instead of 'node'.
- **devcontainer/README.md**: Expanded scope description to include CI contributors and clarified goal to emphasize no host tooling required.
- **devcontainer/STRUCTURE.md**: Updated title to '(Phase 2)' and added note about host keyring forwarding at runtime.
- **docs-site/README.md**: Clarified that the missing `../../docs/` symlink is created at build time in CI.
- **mcp-server/README.md**: Added note clarifying package alignment with the `platform/` tier despite location under `repos/cfx-tools/packages`.
- **vscode-extension/API.md**: Corrected description of active file-keystore reference from 'service/account reference' to 'service/account path'.
- **templates/README.md**: Marked `nextjs-app/` template as 'not yet extracted' instead of just '_new (Phase 2)_'.

## [Unreleased] - 2026-05-02
### Changed
- **lemonade-cli.ts**: Updated test gate to require concurrency=1 and mark as required; refactored docs-upkeep to group scopes by main folder, process leaf-to-root within each group, and share context only within groups; added `--agent`, `--pi-provider`, and `--pi-model` flags; replaced `completeDirect` calls with `completeStructuredAgent`; adjusted commit flags to default `withTests` to true and added `--skip-tests`; updated fallback artifact messages for clarity.
- **lemonade-cli.ts**: Clarified that `--skip-tests` applies only when `withTests` is enabled (default), and updated fallback artifact messages for clarity.
- **scaffold-cli**: Added new package with argument parsing (`args.ts`), scaffolding logic (`scaffold.ts`), template handling (`templates.ts`), and validation (`validate.ts`), including corresponding test files.
- **cli**: Added new test files for `args`, `derive`, `generate`, `status`, and `run` commands to improve test coverage.
- **scaffold-cli**: Added test files for `args`, `scaffold`, `templates`, and `validate` modules.



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

