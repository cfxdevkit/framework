# showcase-local-workspace Specification

## Purpose
TBD - created by archiving change showcase-local-refactor. Update Purpose after archive.
## Requirements
### Requirement: Showcase-local panels SHALL be driven by shared workspace state and actions
The system SHALL treat `ShowcaseWorkspacePanelsProps` and the top-level workspace orchestrator as the canonical integration path for local showcase panels. New or refactored panels SHALL receive derived state and callbacks from the shared workspace flow rather than creating their own client instances or polling loops.

#### Scenario: Panel data is added through the workspace contract
- **WHEN** a panel needs additional runtime state or actions
- **THEN** the new data and callbacks SHALL be added to the shared panel props contract and wired through the workspace runtime before the panel consumes them

#### Scenario: Panels remain presentational by default
- **WHEN** a new panel is added to the local showcase
- **THEN** it SHALL not introduce an independent `ConfluxDevkitClient` integration layer or its own polling loop as the primary data path

### Requirement: Deprecated guide scaffolding SHALL be removed without breaking live snippets
The system SHALL remove the abandoned guide/tutorial metadata from the local showcase while preserving the code snippet constants that active panels still render.

#### Scenario: Live snippets remain available to active panels
- **WHEN** setup, keystore, compiler, deploy, or custom-operation panels render their example code
- **THEN** the snippet constants they consume SHALL remain available through the supported snippet module

#### Scenario: Deprecated guide metadata is absent from the active workspace surface
- **WHEN** the local showcase guide module is inspected after the cleanup lands
- **THEN** unused tutorial metadata exports SHALL not remain in the active workspace path

### Requirement: Keystore helper surface SHALL contain only live runtime helpers
The system SHALL keep only the helper functions in `app/keystore/client.ts` that are still used by the active local showcase runtime.

#### Scenario: Runtime helpers remain available
- **WHEN** the local showcase runtime fetches devnode accounts or the reveal panel requests a reveal token flow
- **THEN** the helper surface SHALL still provide the active `fetchDevnodeAccounts()` and `revealSecret()` behavior

#### Scenario: Unused wrappers are removed
- **WHEN** the keystore helper module is inspected after the cleanup lands
- **THEN** unused thin wrappers that have no call sites in the active workspace SHALL not remain exported

### Requirement: Showcase-local SHALL document the canonical panel integration pattern
The local showcase SHALL keep clear architecture guidance for future changes so panel work continues to flow through the shared workspace orchestration model.

#### Scenario: Architecture guidance reflects the real panel pattern
- **WHEN** a contributor or agent reads the local showcase architecture guidance after the cleanup lands
- **THEN** that guidance SHALL describe the prop-driven workspace orchestration pattern and SHALL not describe a server-action tutorial flow as the canonical extension path

