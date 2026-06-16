# Changesets

This directory stores individual changeset entries. Each `.md` file describes
what changed in one or more publishable packages since the last release.

## Quick reference

```bash
# Create a changeset entry
npx changeset

# Or generate one via the LLM agent (recommended)
pnpm run llm:changeset:generate

# Preview what will be released
npx changeset status

# Check for missing changesets (CI gate)
pnpm run changeset:check

# Apply version bumps and generate changelogs
npx changeset version

# Full release
npx changeset version && git add -A && git commit -m "release: bump versions" && git push
```

## Format

Each file looks like:

```markdown
---
"@cfxdevkit/cdk": patch
"@cfxdevkit/cli": minor
---

Fix the deploy command to handle empty workspace configs.
```

- **Frontmatter**: package names and bump levels (`patch`, `minor`, `major`)
- **Body**: end-user-facing release notes, one sentence per package (optional)

## Bump levels

- `patch` — bugfixes, internal refactors, documentation
- `minor` — new features, backward-compatible additions
- `major` — breaking changes

When in doubt, choose `patch`.

## Which packages?

See `.changeset/config.json` for the `ignore` list (packages excluded from
changesets). All other packages under `repos/cfx-*/packages/` are publishable
and require a changeset entry when modified.

## Full guide

See [docs/guides/changeset.md](../../docs/guides/changeset.md) for the complete
workflow, troubleshooting, and architecture notes.
