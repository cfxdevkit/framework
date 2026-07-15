## ADDED Requirements

### REQ 3.1: API Reference Generation
The `@cfxdevkit/docs-pipeline` MUST generate `content/api.mdx` when `sync:api-reference` is run.

The generated page MUST:
- Aggregate exports from all 27 publishable packages
- Group packages by tier (tier-0 framework, tier-1 platform, tier-2 domain)
- For each package, list all export sub-paths
- Include a summary table with package name, export count, and sub-path links
- Include frontmatter with `title: "API Reference"` and `description: "Public API surfaces for all @cfxdevkit packages"`

### REQ 3.2: API Reference Navigation
The docs-site navigation (`content/_meta.js`) MUST include an "API Reference" entry that links to `/api`.

### REQ 3.3: CLI Command
The docs-pipeline CLI MUST accept `sync api` as a target of the `sync` command.

Usage: `pnpm --filter @cfxdevkit/docs-pipeline run docs -- sync api`

### REQ 3.4: Tier Grouping
Packages MUST be grouped by tier using the same tier logic as `sync:architecture`:
- Tier 0: cfx-core, cfx-keys, cfx-ui, cfx-solidity
- Tier 1: cfx-tools
- Tier 2: cfx-domain
