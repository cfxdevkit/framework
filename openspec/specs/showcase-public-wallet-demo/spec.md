# showcase-public-wallet-demo Specification

## Purpose
TBD - created by archiving change showcase-public-completion. Update Purpose after archive.
## Requirements
### Requirement: Showcase-public wallet page SHALL demonstrate browser-wallet signing flows
The system SHALL extend the `/wallet` route with signing demonstrations for personal sign, EIP-712, and CIP-23 while preserving the existing connection and chain-switch surface.

#### Scenario: Personal sign demonstration
- **WHEN** a connected wallet user triggers the personal-sign demo on `/wallet`
- **THEN** the page SHALL submit a plain-text message to the wallet, await the signature, and display the resulting signature to the user

#### Scenario: EIP-712 demonstration
- **WHEN** an eSpace wallet user triggers the typed-data signing demo on `/wallet`
- **THEN** the page SHALL submit an EIP-712 payload and display the resulting signature to the user

#### Scenario: CIP-23 demonstration
- **WHEN** a Core wallet user triggers the Core typed-data signing demo on `/wallet`
- **THEN** the page SHALL submit a CIP-23 signing payload and display the resulting signature to the user

### Requirement: Showcase-public wallet page SHALL demonstrate dual-space transaction actions
The system SHALL extend the `/wallet` route with native send-transaction demos for eSpace and Core Space and SHALL present a combined dual-space dashboard when both wallet contexts are available.

#### Scenario: eSpace native transfer demo
- **WHEN** an eSpace wallet is connected and the user submits the eSpace send flow on `/wallet`
- **THEN** the page SHALL send a native transfer, surface the transaction hash, and keep the user on the wallet route

#### Scenario: Core native transfer demo
- **WHEN** a Core wallet is connected and the user submits the Core send flow on `/wallet`
- **THEN** the page SHALL send a Core native transfer, surface the transaction hash, and keep the user on the wallet route

#### Scenario: Dual-space dashboard shown
- **WHEN** both Core and eSpace wallet contexts are available on `/wallet`
- **THEN** the page SHALL display both address families and their current balance or chain-state context together in one dashboard surface

