## Why

The docs-site at `repos/cfx-tools/packages/docs-site/` is the user-facing entry point for the `@cfxdevkit` monorepo. Currently it is a functional but incomplete site:

- **No releases/changelog page** — Users can't see what's new in v2.x, breaking the release loop.
- **No guides section** — Onboarding material lives in `docs/guides/` but is not accessible from the site.
- **No API reference** — Developers can't browse the public API surface of any package.
- **Wiki pages are too technical** — gitnexus-generated content dumps full code structure instead of providing readable overviews.
- **Docker build has no sync failure detection** — Stale content can slip through.
- **Coverage page has no data for most packages** — 24/27 packages show no coverage because `test:coverage` hasn't been run.
- **Quickstart only covers `@cfxdevkit/cdk`** — Doesn't surface the broader ecosystem (executor, react, wallet-connect, etc.).

The 2.0 release of all packages makes these gaps especially visible — users need a polished site to understand the new version.

## What Changes

### 1. Auto-generated releases page
A `/releases.mdx` page that reads `.changeset/*.md` entries and renders a changelog grouped by version, with links to `npmjs.com` for provenance verification.

### 2. Guides section
Wire `docs/guides/` into the site as a navigable section with a `/guides/index.mdx` index. Static pages for:
- getting-started.md
- moon-quickstart.md
- publishing-a-framework-package.md
- changeset-workflow.md (already exists in docs/guides/)

### 3. API reference page
A `/api.mdx` page that summarizes all 27 package exports with sub-path tables (same format as package pages, but aggregated).

### 4. Wiki quality improvement
Post-process wiki pages to:
- Condense first 200 words into a one-paragraph overview
- Remove verbose "Integration with Codebase" boilerplate
- Strip "The module contains no executable code" disclaimers

### 5. Docker build hardening
Add a verification step in the Dockerfile that checks `next build` output matches `sync all` expectations. Fail the build if content is missing key pages.

### 6. Coverage page data collection
Add a `sync:coverage` pre-step in the CI pipeline that runs `pnpm test:coverage` for all publishable packages before generating the coverage page.

### 7. Quickstart expansion
Add a "Next packages to try" section in quickstart.mdx linking to executor, react, and wallet-connect.

## Capabilities

### New Capabilities
- `releases-page`: auto-generates `/releases.mdx` from `.changeset` changelog entries
- `guides-section`: exposes `docs/guides/` as a navigable `/guides/` site section
- `api-reference`: generates an aggregated API summary page from all package exports
- `wiki-quality`: post-processes gitnexus-generated wiki content for readability
- `docs-build-pipeline`: hardens Docker build with content verification and coverage pre-step

### Modified Capabilities
- None (all new capabilities)

## Impact

- **Affected code**: `repos/cfx-tools/packages/docs-site/`, `repos/cfx-tools/packages/docs-pipeline/`, `.github/workflows/build-docs.yml`, `.changeset/`
- **Affected systems**: Next.js/Nextra site generation, docs-pipeline sync commands, Docker build workflow
- **User-visible**: New navigation items (Releases, Guides, API), improved wiki readability, better coverage data
- **CI-visible**: Docker build now fails on missing content, coverage data collection runs in CI
