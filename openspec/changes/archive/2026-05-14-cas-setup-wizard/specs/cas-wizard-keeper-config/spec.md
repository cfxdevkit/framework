## ADDED Requirements

### Requirement: User can optionally enable keeper mode
The system SHALL ask whether to enable the keeper (job executor). Keeper mode is disabled by default.

#### Scenario: Keeper mode disabled
- **WHEN** the user selects "No" for keeper mode
- **THEN** the wizard state SHALL set `keeperEnabled = false` and `KEEPER_ENABLED = false` in the generated backend env; no private key is requested

#### Scenario: Keeper mode enabled — private key collected
- **WHEN** the user selects "Yes" for keeper mode
- **THEN** the wizard SHALL prompt for a signer private key using a masked (password) input; the key SHALL NOT be echoed

### Requirement: Wizard verifies signer key on-chain before enabling keeper
When keeper mode is enabled, the system SHALL derive the signer address from the private key, check its native CFX balance, and check whether it is already registered as a keeper on the AutomationManager contract.

#### Scenario: Already registered as keeper
- **WHEN** `isKeeper(signerAddress)` returns true on the AutomationManager
- **THEN** the wizard SHALL display "✓ Already registered as keeper" and proceed

#### Scenario: Not registered — owner registers via wizard
- **WHEN** `isKeeper(signerAddress)` returns false
- **THEN** the wizard SHALL inform the user that `setKeeper()` must be called by the contract owner, prompt for the owner's private key (masked), call `setKeeper(signerAddress, true)` via `sendWrite()` from `@cfxdevkit/contracts/write`, wait for receipt, and display the transaction hash

#### Scenario: Zero CFX balance warning
- **WHEN** the signer address has zero native CFX balance
- **THEN** the wizard SHALL display a warning "Signer has 0 CFX — keeper will not be able to pay gas" and prompt the user to confirm they want to continue anyway
