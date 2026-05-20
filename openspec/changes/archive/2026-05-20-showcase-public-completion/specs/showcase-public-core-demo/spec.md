## ADDED Requirements

### Requirement: Public core demo SHALL support block lookup examples
The `/core` route in `showcase-public` SHALL demonstrate block reads by at least hash and epoch-based lookup.

#### Scenario: Block lookup by hash
- **WHEN** a user submits a block hash in the block lookup section
- **THEN** the page SHALL display the returned block details

#### Scenario: Block lookup by epoch
- **WHEN** a user submits an epoch identifier in the block lookup section
- **THEN** the page SHALL display the returned block details for that epoch

### Requirement: Public core demo SHALL support transaction lookup examples
The `/core` route SHALL demonstrate transaction and receipt reads.

#### Scenario: Transaction lookup by hash
- **WHEN** a user submits a transaction hash in the transaction lookup section
- **THEN** the page SHALL display the returned transaction details

#### Scenario: Receipt lookup by hash
- **WHEN** a user requests the receipt for a known transaction hash
- **THEN** the page SHALL display the returned receipt details

### Requirement: Public core demo SHALL support cross-space read examples
The `/core` route SHALL demonstrate read-only cross-space examples in addition to the existing basic helpers.

#### Scenario: Cross-space read rendered
- **WHEN** a user opens the cross-space section of the `/core` page
- **THEN** the page SHALL display at least one example of reading eSpace-related state through the Conflux RPC surface