## ADDED Requirements

### Requirement: User can view ERC-20 allowances for the AutomationManager
The system SHALL display all ERC-20 token allowances the connected wallet has granted to the AutomationManager contract, grouped by token, showing the current on-chain allowance and the total amount committed by active jobs.

#### Scenario: Allowances load on dashboard
- **WHEN** an authenticated user opens the dashboard
- **THEN** the ApprovalWidget SHALL load and display one row per token that appears in the user's active or pending jobs

#### Scenario: Allowance shown as unlimited
- **WHEN** an allowance value equals or exceeds `MAX_UINT256 / 2`
- **THEN** the widget SHALL display "∞ (unlimited)" instead of a numeric value

#### Scenario: Allowance shown with symbol
- **WHEN** token metadata is available in the pools cache
- **THEN** the widget SHALL display the token symbol and logo instead of a raw address

### Requirement: User can revoke an ERC-20 allowance
The system SHALL allow the connected user to set a token allowance to zero (revoke) directly from the ApprovalWidget.

#### Scenario: Successful revoke
- **WHEN** the user clicks "Revoke" on a token row and the wallet transaction confirms
- **THEN** the allowance SHALL update to zero in the widget

#### Scenario: Revoke disabled for zero allowance
- **WHEN** the current allowance is already zero
- **THEN** the "Revoke" button SHALL be disabled

### Requirement: User can set an exact allowance
The system SHALL allow the connected user to set a token allowance to the exact amount committed by their active jobs (reducing unlimited approvals to the minimum required).

#### Scenario: Set exact allowance
- **WHEN** the user clicks "Set Exact" and the wallet transaction confirms
- **THEN** the allowance SHALL equal the sum of `amountIn` (for limit orders) or `amountPerSwap × remainingSwaps` (for DCA) across active jobs for that token

#### Scenario: Set exact disabled when already exact
- **WHEN** the current allowance equals the committed amount
- **THEN** the "Set Exact" button SHALL be disabled
