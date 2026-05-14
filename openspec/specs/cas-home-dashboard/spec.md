## ADDED Requirements

### Requirement: Home page transforms in-place based on auth state
The system SHALL render the `/` route as a full state machine: (1) not connected hero, (2) wrong network gate, (3) auto-sign in progress, (4) signature rejected with retry, (5) authenticated strategy dashboard — all without navigating away from `/`.

#### Scenario: Not connected state shows hero
- **WHEN** no wallet is connected
- **THEN** the page SHALL display a hero section with headline "Automate your Conflux De-Fi", subtitle text, and a single "Connect Wallet to Start" button

#### Scenario: Wrong network gate
- **WHEN** a wallet is connected but the active chain is not Conflux eSpace (mainnet or testnet, depending on `NEXT_PUBLIC_CAS_NETWORK`)
- **THEN** the page SHALL display a prompt to switch networks with a "Switch to {network name}" button

#### Scenario: Auto-sign in progress
- **WHEN** the wallet just connected and SIWE login is in progress
- **THEN** the page SHALL display a spinner and the message "Check your wallet — sign the message to continue"

#### Scenario: Signature rejected — retry available
- **WHEN** the SIWE signing was rejected or failed
- **THEN** the page SHALL display a "Sign In with Wallet" retry button and the error message

#### Scenario: Authenticated — strategy dashboard shown
- **WHEN** the user has a valid JWT
- **THEN** the page SHALL display the "My Strategies" heading with [Active & Historical] badge, three action buttons (Wrap wCFX, Approvals, + New Strategy), and the Dashboard component below

### Requirement: New Strategy modal
The system SHALL open a modal containing the `StrategyBuilder` component when the user clicks "+ New Strategy". The modal SHALL block body scroll while open and close on Escape or backdrop click, unless a transaction is in progress.

#### Scenario: Open modal
- **WHEN** the user clicks "+ New Strategy"
- **THEN** a modal SHALL open with the `StrategyBuilder` inside a scrollable panel with a "New Strategy" header and close button

#### Scenario: Close blocked during transaction
- **WHEN** a strategy submission transaction is in progress
- **THEN** the close button and backdrop SHALL be disabled and the cursor SHALL indicate the action is blocked

#### Scenario: Close on success
- **WHEN** `StrategyBuilder` calls `onSuccess`
- **THEN** the modal SHALL close

### Requirement: Wrap wCFX modal on home page
The system SHALL open the `WcfxWrapModal` when the user clicks "Wrap wCFX".

#### Scenario: Open wrap modal
- **WHEN** the user clicks "Wrap wCFX"
- **THEN** the `WcfxWrapModal` SHALL open in an overlay

#### Scenario: Close wrap modal
- **WHEN** the user closes the wrap modal
- **THEN** the modal SHALL close and the page state SHALL be unchanged

### Requirement: Approvals modal on home page
The system SHALL open the `ApprovalWidget` as a modal when the user clicks "Approvals".

#### Scenario: Open approvals modal
- **WHEN** the user clicks "Approvals"
- **THEN** the `ApprovalWidget` SHALL open as a full-screen modal overlay

#### Scenario: Close approvals modal
- **WHEN** the user triggers close on the approvals modal
- **THEN** the modal SHALL close

### Requirement: Dashboard route redirects to home
The system SHALL redirect any navigation to `/dashboard` back to `/`.

#### Scenario: Dashboard redirect
- **WHEN** the browser navigates to `/dashboard`
- **THEN** the user SHALL be redirected to `/` via Next.js `redirect()`
