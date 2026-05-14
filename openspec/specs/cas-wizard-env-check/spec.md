## ADDED Requirements

### Requirement: Wizard verifies Node.js version
The system SHALL check that the Node.js runtime is version 24 or higher before proceeding.

#### Scenario: Node version passes
- **WHEN** `process.version` is 24.x or higher
- **THEN** the wizard SHALL proceed to the next phase

#### Scenario: Node version fails
- **WHEN** `process.version` is below 24
- **THEN** the wizard SHALL print an error with the detected version and exit with code 1

### Requirement: Wizard verifies RPC connectivity
The system SHALL verify that the target RPC URL is reachable by sending a `eth_blockNumber` JSON-RPC call.

#### Scenario: RPC reachable
- **WHEN** the RPC URL responds with a valid block number
- **THEN** the wizard SHALL display "RPC OK (block #N)" and continue

#### Scenario: RPC unreachable
- **WHEN** the RPC call fails or times out (within 5 seconds)
- **THEN** the wizard SHALL print the error, allow the user to enter an alternate RPC URL, and retry
