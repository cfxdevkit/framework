# showcase-public-hardware-wallet Specification

## Purpose
TBD - created by archiving change showcase-public-completion. Update Purpose after archive.
## Requirements
### Requirement: Showcase-public keys page SHALL include a browser memory-wallet demo
The system SHALL extend the `/keys` route with a browser-side memory-wallet panel that demonstrates ephemeral key generation without backend persistence.

#### Scenario: Memory wallet generated
- **WHEN** a user triggers the memory-wallet action on `/keys`
- **THEN** the page SHALL generate a browser wallet, display the derived Core and eSpace addresses together with current balance context, and make a demo message-signing action available

### Requirement: Showcase-public keys page SHALL include a Ledger hardware-wallet demo
The system SHALL extend the `/keys` route with a Ledger panel that uses the framework hardware adapter through `@cfxdevkit/wallet`.

#### Scenario: Ledger supported environment
- **WHEN** the browser environment supports the required WebHID capabilities and the user connects a Ledger device
- **THEN** the page SHALL display the connected device context, derive the Core and eSpace addresses together with current balance context, and make a demo message-signing action available

#### Scenario: Ledger unsupported environment
- **WHEN** the browser environment does not support the required WebHID capabilities
- **THEN** the page SHALL display a clear unsupported-environment message instead of presenting a broken connect flow

### Requirement: Showcase-public hardware section SHALL remain browser-only
The system SHALL keep the public showcase hardware-wallet section free of server-backed file-keystore behavior.

#### Scenario: No file-keystore panel on public keys page
- **WHEN** the user views the hardware wallet section on `/keys`
- **THEN** the section SHALL demonstrate only browser-resident or hardware-connected wallet flows and SHALL not require a backend keystore service

### Requirement: Legacy hardware-wallet behavior SHALL not be dropped silently
The system SHALL not delete the legacy `hardware-wallet-showcase` app until its release-critical unique behavior is either ported into `showcase-public` or explicitly documented as superseded.

#### Scenario: Legacy app deleted only after parity decision
- **WHEN** `hardware-wallet-showcase` is removed from the active workspace
- **THEN** its remaining release-critical behavior SHALL already be available in the keeper app or explicitly documented as superseded by the release plan

