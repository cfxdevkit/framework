## 1. Create the typed docs-pipeline package

- [x] 1.1 Create `repos/cfx-tools/packages/docs-pipeline/package.json`, `tsconfig.json`, `vite.config.ts`, and `src/index.ts`
- [x] 1.2 Add package scripts for typed CLI entrypoints and tests in `repos/cfx-tools/packages/docs-pipeline/package.json`
- [x] 1.3 Add root script wiring in `package.json` for the new docs pipeline command surface and any temporary aliases

## 2. Port deterministic generation into TypeScript

- [x] 2.1 Extract shared helpers from `repos/cfx-tools/packages/docs-site/scripts/sync-packages-lib.mjs` into typed modules under `repos/cfx-tools/packages/docs-pipeline/src/content/`
- [x] 2.2 Port `repos/cfx-tools/packages/docs-site/scripts/sync-packages.mjs` into `repos/cfx-tools/packages/docs-pipeline/src/generators/packages.ts`
- [x] 2.3 Port `repos/cfx-tools/packages/docs-site/scripts/sync-wiki.mjs` into `repos/cfx-tools/packages/docs-pipeline/src/generators/wiki.ts`
- [x] 2.4 Port `repos/cfx-tools/packages/docs-site/scripts/sync-architecture.mjs` into `repos/cfx-tools/packages/docs-pipeline/src/generators/architecture.ts`
- [x] 2.5 Port `repos/cfx-tools/packages/docs-site/scripts/sync-coverage.mjs` into `repos/cfx-tools/packages/docs-pipeline/src/generators/coverage.ts`

## 3. Port validation into TypeScript

- [x] 3.1 Port `repos/cfx-tools/packages/docs-site/scripts/validate-packages.mjs` into `repos/cfx-tools/packages/docs-pipeline/src/validation/mdx.ts`
- [x] 3.2 Port `repos/cfx-tools/packages/docs-site/scripts/validate-wiki-mermaid.mjs` into `repos/cfx-tools/packages/docs-pipeline/src/validation/mermaid.ts` as an optional validator, not a noisy mandatory step
- [x] 3.3 Add typed CLI wrappers for sync and validate commands under `repos/cfx-tools/packages/docs-pipeline/src/cli/`

## 4. Rewire docs-site to consume the new package

- [x] 4.1 Replace `repos/cfx-tools/packages/docs-site/package.json` script implementations so they call the docs-pipeline CLI instead of local `.mjs` files
- [x] 4.2 Keep temporary wrapper scripts only where needed for compatibility, then remove obsolete docs-site generation code
- [x] 4.3 Verify docs-site remains limited to rendering/runtime files such as `app/[[...mdxPath]]/page.tsx`, `components/Mermaid.tsx`, and `mdx-components.tsx`

## 5. Move docs-specific LLM orchestration onto typed pipeline APIs

- [x] 5.1 Add typed docs enrichment APIs under `repos/cfx-tools/packages/docs-pipeline/src/llm/` for package pages, wiki regeneration, and shared docs context helpers
- [x] 5.2 Update `repos/cfx-tools/infra/llm-agents/workers/docs/packages.ts` to import docs-pipeline APIs instead of shelling out to `sync:packages`
- [x] 5.3 Update `repos/cfx-tools/infra/llm-agents/workers/docs/package-page-enrichment.ts` to consume shared hash/content helpers from docs-pipeline
- [x] 5.4 Update `repos/cfx-tools/infra/llm-agents/workers/docs/index.ts` and related docs workers to use docs-pipeline as the deterministic execution layer
- [x] 5.5 Keep `repos/cfx-tools/infra/llm-tools` as the dispatcher, but point docs commands at the migrated typed flows

## 6. Move wiki regeneration behind a typed adapter

- [x] 6.1 Port `repos/cfx-tools/packages/docs-site/scripts/update-wiki.mjs` into a typed adapter under `repos/cfx-tools/packages/docs-pipeline/src/llm/wiki.ts`
- [x] 6.2 Rewire `llm:wiki` and docs-site update commands to call the new adapter
- [x] 6.3 Keep GitNexus CLI invocation as the generation backend in phase 1, but remove docs-site ownership of that bridge

## 7. Repoint build, Docker, and deploy flows

- [x] 7.1 Update `.github/workflows/build-docs.yml` to invoke the docs-pipeline CLI for content prep instead of raw script files
- [x] 7.2 Update `repos/cfx-tools/packages/docs-site/Dockerfile` so image builds run the typed docs-pipeline entrypoint before `pnpm build`
- [x] 7.3 Update `.github/workflows/deploy-docs.yml` only where needed to reflect the new stable build contract

## 8. Add tests and complete the cleanup

- [x] 8.1 Add unit and snapshot tests under `repos/cfx-tools/packages/docs-pipeline` for discovery, sanitization, hash handling, and generated MDX output
- [x] 8.2 Add integration coverage for docs sync and validation CLI commands in `repos/cfx-tools/packages/docs-pipeline`
- [x] 8.3 Remove obsolete docs-site `.mjs` pipeline implementations once all callers and workflows are migrated
- [x] 8.4 Run `pnpm check:hotspots`, `pnpm --filter @cfxdevkit/docs-pipeline test`, `pnpm docs:sync`, `pnpm docs:validate-packages`, and `pnpm --filter @cfxdevkit/docs-site build`