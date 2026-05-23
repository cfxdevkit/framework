## ADDED Requirements

### Requirement: A single typed cfx-tools package owns the docs pipeline
The repository SHALL provide a typed `@cfxdevkit/docs-pipeline` package under `repos/cfx-tools/packages/` that owns docs generation, validation, and docs-oriented orchestration APIs.

#### Scenario: Root docs commands target the typed package
- **WHEN** a maintainer runs root docs commands such as docs sync, docs validation, or docs wiki regeneration
- **THEN** those commands resolve to the typed docs-pipeline CLI rather than directly invoking docs-site-local `.mjs` implementation files

#### Scenario: Importable API is available to other tooling
- **WHEN** `llm-agents`, tests, or future repo automation need to execute deterministic docs steps
- **THEN** they can import typed library APIs from `@cfxdevkit/docs-pipeline` instead of shelling out to app-local scripts

### Requirement: docs-site is a rendering boundary
The docs-site package SHALL remain the docs renderer and runtime boundary, not the owner of the content pipeline.

#### Scenario: docs-site build runs after content prep
- **WHEN** docs-site runs `dev`, `build`, or `start`
- **THEN** content preparation is performed by the docs-pipeline entrypoint before or outside the app build step
- **THEN** docs-site itself is responsible only for rendering MDX/Nextra content and runtime components

#### Scenario: Rendering components remain in docs-site
- **WHEN** Mermaid, MDX components, or page wrappers are needed at runtime
- **THEN** those rendering concerns remain in docs-site and are not migrated into the pipeline package