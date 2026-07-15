## ADDED Requirements

### REQ 2.1: Guides Sync
The `@cfxdevkit/docs-pipeline` MUST sync `docs/guides/*.md` files to `content/guides/*.mdx` when `sync:guides` is run.

The generated pages MUST:
- Preserve all original content from `docs/guides/*.md`
- Add Nextra component imports where appropriate (`Callout`, `Tabs`)
- Include frontmatter with extracted title from first heading
- Maintain the original Markdown formatting

### REQ 2.2: Guides Index Page
When `sync:guides` is run, the pipeline MUST generate `content/guides/index.mdx` as a navigation index.

The index page MUST:
- List all available guides with titles and descriptions
- Provide links to each guide
- Include a frontmatter with `title: "Guides"` and `description: "How-to guides for the cfxdevkit monorepo"`

### REQ 2.3: Guides Navigation
The docs-site navigation (`content/_meta.js`) MUST include a "Guides" entry that links to `/guides`.

### REQ 2.4: CLI Command
The docs-pipeline CLI MUST accept `sync guides` as a target of the `sync` command.

Usage: `pnpm --filter @cfxdevkit/docs-pipeline run docs -- sync guides`

### REQ 2.5: Default Guides
The following guides from `docs/guides/` MUST be synced:
- `getting-started.md` → `/guides/getting-started`
- `moon-quickstart.md` → `/guides/moon-quickstart`
- `publishing-a-framework-package.md` → `/guides/publishing-a-framework-package`
- `changeset-workflow.md` → `/guides/changeset-workflow` (or `changeset.md`)
