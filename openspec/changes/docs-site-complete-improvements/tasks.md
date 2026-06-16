## Task List

### Task 1: Add sync:releases to docs-pipeline
**Estimated**: 1 hour
**Priority**: P0 — critical for 2.0 release visibility

1. Create `docs-pipeline/src/sync/releases.ts`
   - Read `.changeset/*.md` files
   - Parse frontmatter for version numbers
   - Group entries by version
   - Render MDX with changelog format (grouped by version, with "What's Changed" sections)
   - Write to `content/releases.mdx`

2. Update `docs-pipeline/src/scripts.ts`
   - Add `'sync:releases'` to `DocsCommandName` union
   - Add case in `runCommand()` to import and call `syncReleases()`

3. Update `docs-pipeline/src/commands.ts`
   - Add `'releases'` to sync command usage: `sync [all|packages|wiki|architecture|coverage|releases|guides|api]`
   - Add case in `resolveDocsInvocation()` for `'releases'` → `'sync:releases'`

4. Test: `pnpm --filter @cfxdevkit/docs-pipeline run docs -- sync releases`
5. Verify: `cat repos/cfx-tools/packages/docs-site/content/releases.mdx` exists

### Task 2: Add sync:guides to docs-pipeline
**Estimated**: 1 hour
**Priority**: P0 — onboarding material

1. Create `docs-pipeline/src/sync/guides.ts`
   - Read `docs/guides/*.md` files
   - Convert Markdown to MDX:
     - Extract title from first heading
     - Add Nextra component imports (`Callout`, `Tabs`)
     - Keep all content as-is (no transformation)
   - Generate `content/guides/index.mdx` as navigation index
   - Write each guide as `content/guides/<slug>.mdx`

2. Update `docs-pipeline/src/scripts.ts`
   - Add `'sync:guides'` to `DocsCommandName`
   - Add case in `runCommand()`

3. Update `docs-pipeline/src/commands.ts`
   - Add `'guides'` to sync command usage
   - Add case in `resolveDocsInvocation()`

4. Test: `pnpm --filter @cfxdevkit/docs-pipeline run docs -- sync guides`
5. Verify: `content/guides/getting-started.mdx` exists

### Task 3: Add sync:api-reference to docs-pipeline
**Estimated**: 1.5 hours
**Priority**: P1 — developer discovery

1. Create `docs-pipeline/src/sync/api-reference.ts`
   - Reuse `discoverDocsPackages()` from `discover/packages.ts`
   - Aggregate exports across all 27 packages
   - Group by tier (using `sync/architecture.ts` tier logic)
   - Render MDX:
     - Summary table: package → export count → sub-path list
     - Expandable sections per package
   - Write to `content/api.mdx`

2. Update `docs-pipeline/src/scripts.ts`
   - Add `'sync:api-reference'` to `DocsCommandName`
   - Add case in `runCommand()`

3. Update `docs-pipeline/src/commands.ts`
   - Add `'api'` to sync command usage
   - Add case in `resolveDocsInvocation()`

4. Test: `pnpm --filter @cfxdevkit/docs-pipeline run docs -- sync api`
5. Verify: `content/api.mdx` exists with package table

### Task 4: Enhance wiki sync with post-processing
**Estimated**: 1.5 hours
**Priority**: P1 — readability

1. Update `docs-pipeline/src/wiki/sync.ts`
   - Add `condenseWikiContent(content: string): string` function
   - Rules:
     - Keep H1 heading
     - Summarize first 200 words into one paragraph
     - Remove sections matching: "Integration with Codebase"
     - Remove sentences containing: "The module contains no executable code"
     - Keep "Configuration Files" and "Package Layout" sections
   - Apply `condenseWikiContent()` in `syncWiki()` before writing MDX

2. Test: `pnpm --filter @cfxdevkit/docs-pipeline run docs -- sync wiki`
3. Verify: `content/wiki/root.mdx` is more concise (was 40+ lines, target < 15 lines)

### Task 5: Update site navigation (_meta.js)
**Estimated**: 15 minutes
**Priority**: P0 — navigation structure

1. Update `docs-site/content/_meta.js`
   - Add `releases`, `guides`, `api` navigation entries
   - Order: quickstart → releases → guides → api → packages → architecture → coverage → wiki

2. Test: `cd repos/cfx-tools/packages/docs-site && pnpm next build`
3. Verify: Navigation sidebar shows new items

### Task 6: Add Docker build verification
**Estimated**: 30 minutes
**Priority**: P2 — quality gate

1. Create `docs-site/scripts/verify-content.mjs`
   - Check required files exist (after sync runs)
   - Count package pages (expect ≥ 25)
   - Fail if critical pages missing

2. Update `docs-site/Dockerfile`
   - Add `RUN node scripts/verify-content.mjs` after `pnpm sync all`
   - Place before `next build`

3. Test: Docker build in CI or locally

### Task 7: Expand quickstart.mdx
**Estimated**: 30 minutes
**Priority**: P2 — ecosystem awareness

1. Edit `docs-site/content/quickstart.mdx`
   - Add "Next packages to try" section after deploy example
   - Link to executor, react, wallet-connect, devnode

2. Verify: quickstart page renders correctly

### Task 8: Add CI coverage pre-step
**Estimated**: 30 minutes
**Priority**: P2 — coverage data

1. Edit `.github/workflows/build-docs.yml`
   - Add "Generate coverage data" step after sync all
   - Run `pnpm --filter "@cfxdevkit/*" test:coverage` with continue-on-error

2. Test: CI workflow runs coverage before building image

### Task 9: Run full sync and validate
**Estimated**: 1 hour
**Priority**: P0 — end-to-end verification

1. Run: `pnpm --filter @cfxdevkit/docs-pipeline run docs -- sync all`
2. Run: `cd repos/cfx-tools/packages/docs-site && pnpm next build`
3. Verify: No build errors, all pages present
4. Run: `pnpm --filter @cfxdevkit/docs-pipeline run docs -- validate content`

### Task 10: Update docs-refresh-sequence.md
**Estimated**: 30 minutes
**Priority**: P3 — documentation

1. Update `docs/docs-refresh-sequence.md`
   - Add new commands: `sync:releases`, `sync:guides`, `sync:api`
   - Update table of "Current state" layers
   - Update "Quick-reference" table

## Execution Order

```
Task 1 (releases) ──┐
Task 2 (guides) ────┼── Task 4 (wiki post-processing) ──┐
Task 3 (api ref) ───┤                                    ├── Task 5 (_meta.js) ──┐
Task 5 (_meta.js) ──┘                                    │                        ├── Task 9 (full sync)
Task 6 (Docker) ─────────────────────────────────────────┤                        │
Task 7 (quickstart) ─────────────────────────────────────┤                        │
Task 8 (CI coverage) ────────────────────────────────────┤                        │
                                                           └────────────────────────┼── Task 10 (docs update)
                                                                                        │
Task 9 validates everything. Task 10 documents the changes.
```

### Status (as of 2026-06-16)
| Task | Status | Notes |
|------|--------|-------|
| 1. sync:releases | ✅ DONE | Parses .changeset/*.md, groups by version |
| 2. sync:guides | ✅ DONE | Syncs docs/guides/*.md to content/guides/ |
| 3. sync:api-reference | ✅ DONE | Aggregates all 27 package exports |
| 4. wiki post-processing | ✅ DONE | Removes boilerplate, condenses content |
| 5. _meta.js navigation | ✅ DONE | Added releases, guides, api entries |
| 6. Docker verification | ⏳ TODO | scripts/verify-content.mjs |
| 7. Quickstart expansion | ⏳ TODO | Add "Next packages to try" section |
| 8. CI coverage pre-step | ⏳ TODO | build-docs.yml coverage collection |
| 9. Full sync validation | ⏳ TODO | Run sync all + next build |
| 10. Documentation update | ⏳ TODO | Update docs-refresh-sequence.md |

## Deferred (Not in Scope)

### Wiki LLM Generation with Local Model
- **Model**: `Qwen3.6-35B-A3B-MTP-GGUF-Q8_0` (lemonade/local)
- **Command**: `cdk docs wiki generate --model local --model-path /path/to/Qwen3.6-35B-A3B-MTP-GGUF-Q8_0`
- **Scope**: Full LLM rewrite of wiki pages with better summaries
- **Why deferred**: Model dependency, build time, hardware requirements
- **Plan**: Follow-up change `docs/wiki-llm-generation` after this one is merged
