## ADDED Requirements

### REQ 1.1: Releases Page Generation
The `@cfxdevkit/docs-pipeline` MUST generate `content/releases.mdx` when `sync:releases` is run.

The generated page MUST:
- Parse all `.changeset/*.md` files
- Group entries by version number found in frontmatter
- Display versions in descending order (newest first)
- Show each version's entries as bullet points with package names and change descriptions
- Include a link to `https://www.npmjs.com/package/@cfxdevkit/<pkg>/v/<version>` for each package
- Include a frontmatter with `title: "Releases"` and `description: "Changelog for @cfxdevkit packages"`

### REQ 1.2: Releases Page Navigation
The docs-site navigation (`content/_meta.js`) MUST include a "Releases" entry that links to `/releases`.

### REQ 1.3: CLI Command
The docs-pipeline CLI MUST accept `sync releases` as a target of the `sync` command.

Usage: `pnpm --filter @cfxdevkit/docs-pipeline run docs -- sync releases`
