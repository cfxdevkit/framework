## ADDED Requirements

### Requirement: separate-routes
Each hardware wallet demo must have its own URL route.

#### Scenario: onekey route
- **WHEN** the user navigates to `/keys/onekey`
- **THEN** only the OneKey panel renders; no Ledger UI is visible

#### Scenario: ledger route
- **WHEN** the user navigates to `/keys/ledger`
- **THEN** only the Ledger panel renders; no OneKey UI is visible

### Requirement: overview-links
The `/keys` page must link to each sub-page.

#### Scenario: overview cards
- **WHEN** the `/keys` page renders
- **THEN** three device cards are visible: Memory, Ledger, OneKey
- **THEN** each card is a link to the corresponding sub-route
- **THEN** the capability matrix is visible above the cards

### Requirement: back-navigation
Each sub-page must provide navigation back to the overview.

#### Scenario: back link
- **WHEN** any of `/keys/memory`, `/keys/ledger`, `/keys/onekey` renders
- **THEN** a "← Keys & Signers" link is present that navigates to `/keys`
