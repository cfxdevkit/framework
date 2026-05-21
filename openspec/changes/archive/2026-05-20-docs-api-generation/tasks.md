## 1. Deterministic API extractor (`arch-check`)

- [ ] 1.1 Add `src/api/extract.ts` — reads `package.json` exports, loads `dist/*.d.ts` via `ts.createSourceFile`, resolves `export * from` up to depth 2, returns typed list of `{ name, kind, signature }` per sub-path
- [ ] 1.2 Add `src/api/hash.ts` — SHA-256 of sorted sub-path `.d.ts` file contents; read-hash from `<!-- api-hash: -->` comment in existing `API.md`
- [ ] 1.3 Add `src/api/render.ts` — renders `API.md` markdown: title, sub-paths table, per-subpath code blocks, hash footer
- [ ] 1.4 Add `src/api/filter.ts` — determines which packages are "public + has-dist" (skip config packages, private internal packages, and packages without `dist/`)
- [ ] 1.5 Add `src/bin/generate-api.ts` — CLI bin: parses `--write`, `--check`, `--package` flags; iterates public packages; calls extract → hash → render; writes or checks
- [ ] 1.6 Register `generate-api` task in `arch-check/moon.yml` with `inputs` (all `dist/*.d.ts`, all `package.json`) and `outputs` (all `API.md`)

## 2. Staleness check in `check:docs`

- [ ] 2.1 Add `checkApiDocs()` function to `src/checks/docs.ts` — for each public package: warn if `API.md` missing, warn if no `api-hash` footer, warn if hash mismatch
- [ ] 2.2 Call `checkApiDocs()` from `runDocsCheck()` in `docs.ts`
- [ ] 2.3 Add `pnpm gen:api` root script shortcut → `moon run arch-check:generate-api`

## 3. LLM enrichment worker (`llm-agents`)

- [ ] 3.1 Add `workers/docs/api-enrichment.ts` — takes a package path + current `API.md` skeleton + relevant `src/` files; builds prompt; calls `completeStructuredAgent`; returns enriched lines per export symbol
- [ ] 3.2 Add `workers/docs/api.ts` — orchestrates: discover public packages → run `generate:api --write` → call enrichment worker per package → write enriched `API.md` (preserve hash footer)
- [ ] 3.3 Export `runDocsApi` from `workers/docs/index.ts`

## 4. CLI wiring (`llm-tools`)

- [ ] 4.1 Register `docs-api` action in `llm-tools` dispatcher (alongside `docs-upkeep`)
- [ ] 4.2 Add `llm:docs-api` script to root `package.json`
- [ ] 4.3 Add `llm:docs-api` script to `repos/cfx-tools/infra/llm-tools/package.json`

## 5. Integrate staleness gate into docs-upkeep

- [ ] 5.1 In `workers/docs/index.ts` `runDocsUpkeep`, add step 0: run `generate:api --check`; if stale, run `generate:api --write` before LLM prose pass

## 6. Build, types, quality gates

- [ ] 6.1 Run `pnpm --filter @cfxdevkit/arch-check build` and fix any TypeScript errors
- [ ] 6.2 Run `pnpm --filter @cfxdevkit/llm-agents build` and fix any errors
- [ ] 6.3 Run `pnpm -w typecheck`, `pnpm -w lint`, `pnpm arch:check` — all green
- [ ] 6.4 Run `pnpm gen:api` end-to-end — verify `API.md` is generated for the 12 missing packages
