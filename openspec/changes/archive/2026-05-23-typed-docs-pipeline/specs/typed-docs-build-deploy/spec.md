## ADDED Requirements

### Requirement: Build and deploy flows target a stable docs pipeline interface
The docs image build, local container build path, and deploy pipeline SHALL target stable docs-pipeline commands rather than raw implementation file paths.

#### Scenario: GitHub docs build prepares content through the typed pipeline
- **WHEN** the docs image build workflow prepares content before building the docs image
- **THEN** it invokes the docs-pipeline CLI rather than directly running docs-site script files

#### Scenario: Docker build uses the same pipeline contract as local and CI runs
- **WHEN** the docs-site Dockerfile performs docs preparation ahead of `pnpm build`
- **THEN** it calls the docs-pipeline entrypoint used by local and CI flows

#### Scenario: Deploy stays coupled to the built image, not internal prep scripts
- **WHEN** docs deployment runs after a successful docs image build
- **THEN** deploy only depends on the image/build contract and does not need direct knowledge of docs-site generation implementation details