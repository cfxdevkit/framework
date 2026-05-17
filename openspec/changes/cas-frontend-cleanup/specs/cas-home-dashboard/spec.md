## MODIFIED Requirements

### Requirement: New Strategy modal
The system SHALL treat the home page modal as the canonical authenticated strategy-creation flow. The system SHALL open a modal containing the `StrategyBuilder` component when the user clicks "+ New Strategy". The modal SHALL block body scroll while open and close on Escape or backdrop click, unless a transaction is in progress. The app SHALL NOT present a separate authenticated full-page strategy builder.

#### Scenario: Open modal
- **WHEN** the user clicks "+ New Strategy"
- **THEN** a modal SHALL open with the `StrategyBuilder` inside a scrollable panel with a "New Strategy" header and close button

#### Scenario: Close blocked during transaction
- **WHEN** a strategy submission transaction is in progress
- **THEN** the close button and backdrop SHALL be disabled and the cursor SHALL indicate the action is blocked

#### Scenario: Close on success
- **WHEN** `StrategyBuilder` calls `onSuccess`
- **THEN** the modal SHALL close

### Requirement: Dashboard and create routes redirect to home
The system SHALL redirect any navigation to `/dashboard` or `/create` back to `/`.

#### Scenario: Dashboard redirect
- **WHEN** the browser navigates to `/dashboard`
- **THEN** the user SHALL be redirected to `/` via Next.js `redirect()`

#### Scenario: Create redirect
- **WHEN** the browser navigates to `/create`
- **THEN** the user SHALL be redirected to `/` via Next.js `redirect()`
