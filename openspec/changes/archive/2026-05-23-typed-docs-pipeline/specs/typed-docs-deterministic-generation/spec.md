## ADDED Requirements

### Requirement: Deterministic docs generation is implemented in TypeScript
Package sync, wiki sync, architecture sync, coverage sync, and MDX validation SHALL be implemented as typed modules in `@cfxdevkit/docs-pipeline`.

#### Scenario: Package pages are generated from typed pipeline code
- **WHEN** package docs sync runs
- **THEN** the pipeline discovers public packages, reads README/API/package metadata, sanitizes MDX-unsafe content, and writes `content/packages/*.mdx` via typed library code

#### Scenario: Wiki content is converted through a typed adapter
- **WHEN** wiki sync runs against generated `.gitnexus/wiki/*.md` content
- **THEN** the pipeline converts markdown into docs-site MDX, preserves Mermaid rendering behavior, and applies the repo MDX sanitization rules from typed code

#### Scenario: MDX validation runs before full build
- **WHEN** generated docs content is validated
- **THEN** the pipeline compiles generated MDX under `content/` using the same MDX toolchain the docs site expects
- **THEN** invalid MDX content is reported before the full Next.js build step

### Requirement: Shared docs pipeline primitives are centralized
Shared docs pipeline rules SHALL be implemented once and reused across deterministic generators.

#### Scenario: Slugs, hashes, and sanitization are consistent
- **WHEN** package pages, wiki pages, or future docs generators need shared rules for slugging, hash footers, or MDX sanitization
- **THEN** they use shared typed modules from the docs-pipeline package rather than copy-pasting logic into separate scripts

#### Scenario: Optional Mermaid validation stays non-blocking by default
- **WHEN** Mermaid validation is available in the typed pipeline
- **THEN** it can be invoked explicitly or as an opt-in check
- **THEN** it does not add mandatory noisy output to normal wiki regeneration unless the caller requests it