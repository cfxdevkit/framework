## Context

The current documentation flow has three distinct layers, but their responsibilities are mixed.

1. Root commands in `package.json` expose user-facing entrypoints such as `docs:sync`, `docs:validate-packages`, `llm:wiki`, `llm:package-pages`, and `llm:docs-upkeep`.
2. Deterministic generation currently lives in docs-site-local `.mjs` scripts:
   - `sync-packages.mjs`
   - `sync-wiki.mjs`
   - `sync-architecture.mjs`
   - `sync-coverage.mjs`
   - `validate-packages.mjs`
   - `update-wiki.mjs`
3. LLM orchestration already exists in TypeScript under `repos/cfx-tools/infra/llm-agents/workers/docs`, but those workers still shell out to docs-site-owned scripts for key steps.

The result is a fragile ownership model:

- docs-site owns pipeline code that should be reusable outside the app
- deterministic and LLM paths cannot share library code cleanly
- build and deploy automation target implementation files instead of a stable interface
- typed testing of the docs pipeline is harder than it should be

The target state is a single typed docs pipeline package in `cfx-tools` that exposes both library APIs and CLI commands. docs-site remains the renderer. `llm-tools` remains the dispatcher. `llm-client` remains the transport/config layer for Lemonade.

## Goals / Non-Goals

**Goals:**
- Create a new `@cfxdevkit/docs-pipeline` package under `repos/cfx-tools/packages/`.
- Move deterministic docs generation and validation into typed modules.
- Provide importable library APIs and CLI entrypoints for the docs pipeline.
- Rewire docs-specific `llm-agents` workflows to call typed pipeline APIs.
- Repoint root commands, build, Docker, and deploy to the new pipeline surface.
- Reduce docs-site to rendering/runtime ownership only.

**Non-Goals:**
- Replacing `llm-client` or the Lemonade configuration model.
- Replacing GitNexus wiki generation with a non-GitNexus implementation in the first pass.
- Redesigning the docs-site UI or Nextra page architecture.
- Expanding docs-upkeep into a general repository content-management system beyond current scope.

## Decisions

### D1: Create a dedicated `@cfxdevkit/docs-pipeline` package
The new package lives under `repos/cfx-tools/packages/docs-pipeline`. It owns docs generation, validation, and docs-specific orchestration primitives. This keeps the pipeline in `cfx-tools`, where maintainable automation belongs, and avoids burying core logic inside the docs app or generic LLM agent package.

### D2: docs-site becomes a renderer boundary, not a generation owner
docs-site keeps:
- Next/Nextra app routes
- MDX component registration
- Mermaid rendering component
- local `dev`, `build`, and `start`

docs-site stops owning:
- content discovery
- package inventory traversal
- MDX sanitization policies
- wiki conversion logic
- architecture/coverage page generation
- pipeline-level validation entrypoints

### D3: Expose both library APIs and CLI wrappers
The new package must support two call styles:

- library imports for `llm-agents`, tests, and future automation
- CLI entrypoints for root scripts, CI, Docker, and manual use

This avoids the current pattern where TypeScript code shells out to `.mjs` scripts for deterministic steps.

### D4: Consolidate shared docs pipeline primitives
The following logic moves into shared typed modules reused by all pipeline stages:

- public package discovery and skip rules
- package slug derivation
- content hash read/write helpers
- MDX sanitization helpers
- MDX validation helpers
- common result/report types

This removes duplication between package page sync, README/API upkeep, wiki sync, architecture sync, and coverage sync.

### D5: Keep `llm-client` as the LLM transport/config layer
The new docs pipeline does not replace model discovery, chat completion, or Lemonade config handling. Those remain in `@cfxdevkit/llm-client`. The docs pipeline imports that layer for docs-specific enrichment flows.

### D6: Wrap GitNexus wiki generation behind a typed adapter first
`gitnexus wiki` remains the upstream wiki-generation mechanism in the first phase. The new pipeline wraps it behind a typed adapter so the rest of the repo consumes a stable API rather than a docs-site-local script.

### D7: Build and deploy flows target the new pipeline CLI
The stable contract for local runs, CI, Docker build, and deployment becomes the docs-pipeline CLI. GitHub workflows and the Dockerfile stop invoking docs-site implementation files directly.

### D8: Migration happens in compatibility phases
Phase 1 introduces the new package and moves logic behind it.
Phase 2 rewires callers and keeps thin compatibility shims.
Phase 3 removes obsolete docs-site scripts and old command aliases once callers are migrated.

## Proposed Package Shape

`repos/cfx-tools/packages/docs-pipeline/`

- `src/discovery/`
  - package inventory
  - repo scanning
  - skip rules
- `src/content/`
  - hash helpers
  - MDX sanitization
  - slug helpers
  - frontmatter rendering
- `src/generators/`
  - packages
  - wiki
  - architecture
  - coverage
- `src/validation/`
  - MDX compile validation
  - optional mermaid validation hooks
- `src/llm/`
  - package pages
  - docs upkeep bridge
  - wiki regenerate bridge
- `src/cli/`
  - sync
  - validate
  - wiki
  - packages
  - architecture
  - coverage
- `src/index.ts`

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Migration touches many entrypoints at once | Stage the rollout: library first, CLI next, callers last |
| docs-site builds may depend on current relative-path assumptions | Keep thin compatibility wrappers until CI and Docker are green on the new package |
| `llm-agents` docs workers may still need docs-site-specific content assumptions | Move shared data contracts first, then change orchestration call sites |
| GitNexus wiki generation is still a subprocess boundary | Wrap it in a typed adapter first; revisit deeper integration only after the migration stabilizes |
| Command renames could disrupt existing habits | Keep a documented alias layer during the transition, even if long-term names change |

## Validation Strategy

- Unit tests for discovery, slugging, hashing, and MDX sanitization
- Snapshot tests for generated MDX outputs
- Integration tests for docs-pipeline CLI commands on fixture content
- Existing docs-site build validation remains mandatory
- CI workflows updated to use the new CLI before old scripts are removed