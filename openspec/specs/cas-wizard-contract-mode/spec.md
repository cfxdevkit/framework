## ADDED Requirements

### Requirement: User chooses canonical or fresh contract deployment
The system SHALL ask the user whether to use canonical deployed contract addresses (default) or deploy fresh contracts.

#### Scenario: Canonical contracts selected (testnet or mainnet)
- **WHEN** the network is testnet or mainnet and the user confirms use of canonical contracts
- **THEN** the wizard state SHALL retain the pre-filled contract addresses and skip deployment

#### Scenario: Fresh deploy selected (local devnode only)
- **WHEN** the network is local-devnode and the user chooses "Deploy fresh"
- **THEN** the wizard SHALL prompt for a deployer private key (masked), deploy AutomationManager, PermitHandler, and SwappiPriceAdapter using `deployContract()` from `@cfxdevkit/contracts/deploy`, and update the wizard state with the resulting contract addresses

#### Scenario: Fresh deploy blocked on non-local network
- **WHEN** the network is testnet or mainnet
- **THEN** the "Deploy fresh" option SHALL NOT be available (only canonical addresses are shown)

### Requirement: Deployment uses framework deploy utility
All contract deployments SHALL use `deployContract({ client, signer, abi, bytecode, args? })` from `@cfxdevkit/contracts/deploy` with ABI and bytecode imported from `@cfxdevkit/protocol`. No external tools (forge, hardhat, cast) SHALL be required.

#### Scenario: Deploy succeeds
- **WHEN** all three contracts are deployed successfully
- **THEN** the wizard SHALL display each contract name and deployed address, then continue

#### Scenario: Deploy fails
- **WHEN** any contract deployment transaction reverts or times out
- **THEN** the wizard SHALL display the error and exit with code 1 (no partial state written)
