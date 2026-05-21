## ADDED Requirements

### Requirement: Deterministic API skeleton generation
The `generate:api --write` command reads each public package's `package.json` exports and corresponding `dist/*.d.ts` files, then writes a deterministic `API.md` to the package root.

#### Scenario: Fresh package with no API.md
- **WHEN** `generate:api --write` targets a package with no existing `API.md`
- **THEN** creates `API.md` with: title header, sub-paths table, per-subpath export blocks, and `<!-- api-hash: <sha256> -->` footer

#### Scenario: Package with stale API.md
- **WHEN** the `.d.ts` content changes after a previous `--write` run
- **THEN** `generate:api --check` emits a `warning` finding for that package
- **THEN** `generate:api --write` overwrites `API.md` with updated skeleton

#### Scenario: Package with current API.md
- **WHEN** `.d.ts` hash matches the hash in `API.md` footer
- **THEN** `generate:api --check` emits no finding for that package
- **THEN** `generate:api --write` skips the package (no write)

#### Scenario: Sub-path `.d.ts` resolves `export * from`
- **WHEN** a sub-path `.d.ts` file contains only `export * from './...'` re-exports
- **THEN** the generator recursively reads the referenced `.d.ts` up to depth 2 to enumerate named exports

#### Scenario: Config-only packages are excluded
- **WHEN** a package is `biome-config`, `tsconfig`, `moon-config`, or has no `exports` map
- **THEN** it is skipped by `generate:api` without error
