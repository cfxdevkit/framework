## ADDED Requirements

### Requirement: Wallet shell renders distinct blank and locked entry surfaces
The system SHALL present blank-state setup and locked-state unlock as distinct wallet-shell surfaces rather than one ambiguous combined management view.

#### Scenario: Blank shell focuses on keystore creation
- **WHEN** the keystore phase is `blank`
- **THEN** the shell presents keystore creation as the primary action
- **THEN** the surface explains that the passphrase protects local keystore access
- **THEN** wallet and account switchers are not shown

#### Scenario: Locked shell focuses on unlock
- **WHEN** the keystore phase is `locked`
- **THEN** the shell presents unlock as the primary action
- **THEN** the surface does not present wallet or account selection until unlock succeeds

### Requirement: Wallet shell shows a persistent dual-chain identity strip when unlocked
The system SHALL render a persistent identity strip for the currently selected wallet and account whenever the keystore is unlocked, including the dual-chain address pair for the selected derived account.

#### Scenario: Active identity strip shows selected wallet and dual-chain account
- **WHEN** the keystore phase is `unlocked` or `active-wallet` and an active wallet and account exist
- **THEN** the shell shows the selected wallet root
- **THEN** the shell shows the selected account index
- **THEN** the shell shows both `espaceAddress` and `coreAddress`
- **THEN** the identity strip remains visible while secondary management content changes

#### Scenario: Unlocked shell with no active wallet prompts selection
- **WHEN** the keystore is unlocked but no wallet root is active
- **THEN** the shell presents an explicit choose-wallet state
- **THEN** no fabricated active account identity is shown

### Requirement: Wallet root switching uses a dropdown overlay
The system SHALL provide wallet-root switching through a dropdown overlay anchored to the identity strip, not through an always-visible flat list of wallets.

#### Scenario: Wallet switcher opens on demand
- **WHEN** the user invokes wallet switching from the identity strip
- **THEN** a dropdown overlay lists available wallet roots
- **THEN** the current wallet root is marked as selected
- **THEN** activating a wallet from the overlay updates the shell identity strip

### Requirement: Derived-account switching uses a dropdown overlay
The system SHALL provide derived-account switching through a dropdown overlay that is separate from the wallet-root switcher.

#### Scenario: Account switcher shows derived accounts for the current wallet root
- **WHEN** the user invokes account switching from the identity strip
- **THEN** a dropdown overlay lists the available derived accounts for the current wallet root
- **THEN** the current account is marked as selected
- **THEN** activating an account updates the displayed `espaceAddress` and `coreAddress`

### Requirement: Wallet shell allows optional portfolio content without owning portfolio logic
The system SHALL allow consumers to attach portfolio or balance content to the wallet shell without making portfolio fetching a prerequisite for the base keystore lifecycle.

#### Scenario: Consumer omits portfolio content
- **WHEN** a consumer renders the wallet shell without a portfolio slot or portfolio props
- **THEN** keystore creation, unlock, wallet switching, and account switching still function normally

#### Scenario: Consumer provides portfolio content
- **WHEN** a consumer renders the wallet shell with portfolio content
- **THEN** the portfolio area is shown adjacent to the selected wallet and account identity
- **THEN** the base shell does not require a specific balance backend or chain-specific portfolio implementation
