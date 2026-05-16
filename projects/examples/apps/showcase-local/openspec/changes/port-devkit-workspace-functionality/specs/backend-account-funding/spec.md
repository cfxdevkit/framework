## ADDED Requirements

### Requirement: Dual-family funding support
The backend SHALL fund both Core Space and eSpace addresses through the shared accounts API while the local devnode is running.

#### Scenario: Fund eSpace address from backend faucet
- **WHEN** a client requests funding for an eSpace address while the local devnode is running
- **THEN** the backend submits the transfer from the backend-managed faucet account and returns the transaction hash and detected chain family

#### Scenario: Fund Core Space address from backend faucet
- **WHEN** a client requests funding for a Core Space address while the local devnode is running
- **THEN** the backend submits the transfer from the backend-managed faucet account and returns the transaction hash and detected chain family instead of rejecting the request as unsupported

### Requirement: Funding failure behavior is explicit
The backend SHALL reject funding requests that cannot be executed safely.

#### Scenario: Reject funding when local devnode is unavailable
- **WHEN** a client requests funding and the local devnode is not running
- **THEN** the backend returns a service-unavailable error explaining that local funding requires a running node

#### Scenario: Reject funding with missing request fields
- **WHEN** a client requests funding without a target address or transfer amount
- **THEN** the backend returns a validation error describing the missing required fields

### Requirement: Funding responses confirm execution
The backend SHALL not report successful funding until the transfer has been accepted by the target chain family.

#### Scenario: Confirm funding result before success response
- **WHEN** the backend submits a local funding transaction
- **THEN** it waits for the chain-specific confirmation behavior used by that family before returning success to the client