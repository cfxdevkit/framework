## Why

The documentation pipeline is currently split across too many ownership boundaries:

- Root commands in `package.json`
- Deterministic generation scripts in `repos/cfx-tools/packages/docs-site/scripts/*.mjs`
- LLM docs orchestration in `repos/cfx-tools/infra/llm-agents/workers/docs/*.ts`
- CLI dispatch in `repos/cfx-tools/infra/llm-tools`
- Build and deploy wiring in GitHub workflows and the docs-site Dockerfile

That split makes the pipeline harder to maintain than it needs to be. Deterministic generation logic lives inside the app package that renders docs. LLM workers shell out to app-local scripts instead of importing typed library code. Discovery, skip rules, hashing, MDX sanitization, and content validation are duplicated across multiple flows. Build and deploy still target raw scripts instead of a stable typed interface.

The repository is already moving toward typed automation in `cfx-tools`. The docs pipeline should follow the same direction so it can be versioned, tested, validated, and reused like the rest of the toolchain.

## What Changes

- Add a new TypeScript package under `repos/cfx-tools/packages/` to own docs generation, validation, and docs-specific local-LLM orchestration.
- Move deterministic generators out of docs-site `.mjs` scripts into typed library modules with CLI entrypoints.
- Rewire `llm-agents` docs workflows to call typed pipeline APIs instead of shelling out to docs-site scripts.
- Repoint root scripts, docs-site build hooks, Docker build, and docs workflows to the new typed pipeline CLI.
- Reduce docs-site to a rendering/runtime boundary: Nextra app, MDX components, Mermaid component, and Next build/start.
- Allow command renames during migration, while exposing both importable APIs and CLI wrappers from the new package.

## Capabilities

### New Capabilities

- `typed-docs-pipeline-core`: A single typed `@cfxdevkit/docs-pipeline` package owns docs generation, validation, and docs-oriented orchestration APIs.
- `typed-docs-deterministic-generation`: Package-page sync, wiki sync, architecture sync, coverage sync, and MDX validation are implemented as TypeScript library functions with CLI wrappers.
- `typed-docs-llm-enrichment`: Docs-specific LLM flows call typed pipeline APIs and `llm-client` primitives rather than app-local scripts.
- `typed-docs-build-deploy`: CI, Docker build, and deploy flows invoke stable typed docs-pipeline commands instead of raw script files.

### Modified Capabilities

- `docs-site`: becomes a rendering consumer of generated content rather than the owner of the generation pipeline.
- `llm-tools`: remains the dispatcher for local-LLM commands, but routes docs commands through typed pipeline entrypoints.
- `docs-upkeep`: continues to orchestrate docs maintenance, but uses the typed docs pipeline as its deterministic execution layer.

## Impact

Affects:
- `repos/cfx-tools/packages/docs-site`
- `repos/cfx-tools/packages/docs-pipeline` (new)
- `repos/cfx-tools/infra/llm-agents`
- `repos/cfx-tools/infra/llm-tools`
- Root `package.json`
- `.github/workflows/build-docs.yml`
- `.github/workflows/deploy-docs.yml`
- `repos/cfx-tools/packages/docs-site/Dockerfile`