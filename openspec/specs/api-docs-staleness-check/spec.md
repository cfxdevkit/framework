# api-docs-staleness-check Specification

## Purpose
TBD - created by archiving change docs-api-generation. Update Purpose after archive.
## Requirements
### Requirement: check:docs reports missing API.md
`check:docs` warns for every public package that lacks an `API.md` file.

#### Scenario: Public package missing API.md
- **WHEN** a package is public (non-private), has a `dist/` output, and has no `API.md`
- **THEN** `check:docs` emits a `warning` finding: `"Public package missing API.md: <rel>"`

#### Scenario: Private or config package has no API.md
- **WHEN** a package is `private: true`, or is one of the config packages, or has no `dist/`
- **THEN** `check:docs` emits no finding for the missing `API.md`

### Requirement: check:docs reports stale API.md
`check:docs` recomputes the `.d.ts` hash for each package that has an `API.md` and compares against the embedded `<!-- api-hash: -->` footer.

#### Scenario: Stale API.md (hash mismatch)
- **WHEN** `API.md` exists but its embedded hash does not match the current `dist/*.d.ts` content
- **THEN** `check:docs` emits a `warning` finding: `"API.md is stale (exports changed): <rel>"`

#### Scenario: No hash footer (manually authored API.md)
- **WHEN** `API.md` exists but contains no `<!-- api-hash: -->` comment
- **THEN** `check:docs` emits a `warning` finding: `"API.md has no api-hash footer (run generate:api --write): <rel>"`

#### Scenario: Fresh API.md (hash matches)
- **WHEN** `API.md` exists and its embedded hash matches current `.d.ts` content
- **THEN** `check:docs` emits no staleness finding for that package

