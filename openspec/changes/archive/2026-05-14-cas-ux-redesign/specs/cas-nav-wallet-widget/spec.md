## ADDED Requirements

### Requirement: Persistent sticky NavBar with wallet status
The system SHALL render a sticky top navigation bar on all pages containing: (1) the app logo/name linking to `/`, (2) navigation links (`Status`, and `Safety` visible to admins only), (3) a `WalletConnect` chip on the right.

#### Scenario: NavBar visible on all pages
- **WHEN** any page in the app is loaded
- **THEN** the NavBar SHALL be fixed at the top with `position: sticky` or equivalent, with a semi-transparent dark backdrop and blur effect

#### Scenario: Admin-only Safety link
- **WHEN** the connected wallet's address is in the admin list (`useIsAdmin` returns true)
- **THEN** the NavBar SHALL display a "Safety" link pointing to `/safety`

#### Scenario: Safety link hidden for non-admin
- **WHEN** `useIsAdmin` returns false or the wallet is not connected
- **THEN** the "Safety" link SHALL NOT be visible

### Requirement: WalletConnect chip in NavBar
The system SHALL display a compact wallet chip in the NavBar that handles all connection and authentication states.

#### Scenario: Chip shows Connect button when disconnected
- **WHEN** no wallet is connected
- **THEN** the NavBar SHALL show a "Connect Wallet" button

#### Scenario: Chip shows wrong network warning
- **WHEN** wallet is connected but on the wrong chain
- **THEN** the chip SHALL show a "Switch Network" button with an amber/warning color

#### Scenario: Chip shows loading state during SIWE
- **WHEN** SIWE login is in progress
- **THEN** the chip SHALL show a spinner icon next to the truncated address

#### Scenario: Chip shows unsigned state (retry available)
- **WHEN** the wallet is connected but SIWE was rejected or not yet signed
- **THEN** the chip SHALL show the truncated address with an orange status dot and a "Sign In" button

#### Scenario: Chip shows authenticated state
- **WHEN** a valid JWT is present
- **THEN** the chip SHALL show the truncated address with a green status dot and a disconnect/power button

#### Scenario: Address copy on chip click
- **WHEN** the user clicks the address portion of the chip
- **THEN** the full address SHALL be copied to the clipboard and a brief "Copied!" confirmation SHALL appear

### Requirement: Auto-sign on wallet connect
The system SHALL automatically trigger SIWE login once when a wallet connects and no valid JWT exists. The auto-sign SHALL fire at most once per connection event.

#### Scenario: Auto-sign fires on connect
- **WHEN** `isConnected` becomes true and `token` is null
- **THEN** `login()` SHALL be called automatically without requiring user action

#### Scenario: Auto-sign does not re-fire on re-render
- **WHEN** the component re-renders while a SIWE request is already in progress
- **THEN** a second `login()` call SHALL NOT be made

#### Scenario: Auto-sign guard resets on address change
- **WHEN** the wallet switches to a different address
- **THEN** the auto-sign guard SHALL reset and a new auto-sign SHALL fire for the new address

#### Scenario: JWT cleared on address switch
- **WHEN** the wallet changes to a different address
- **THEN** the stored JWT SHALL be cleared so the new address must authenticate
