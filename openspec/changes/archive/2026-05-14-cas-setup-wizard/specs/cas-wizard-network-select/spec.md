## ADDED Requirements

### Requirement: User selects target network
The system SHALL prompt the user to choose the target Conflux eSpace network from: testnet, mainnet, or local-devnode.

#### Scenario: Testnet selected
- **WHEN** the user selects "testnet"
- **THEN** the wizard state SHALL set `network = "testnet"`, `rpcUrl = "https://evmtestnet.confluxrpc.com"`, and pre-fill all five contract addresses with the known testnet values

#### Scenario: Mainnet selected
- **WHEN** the user selects "mainnet"
- **THEN** the wizard state SHALL set `network = "mainnet"`, `rpcUrl = "https://evm.confluxrpc.com"`, and pre-fill all five contract addresses with the known mainnet values

#### Scenario: Local devnode selected
- **WHEN** the user selects "local-devnode"
- **THEN** the wizard state SHALL set `network = "local"`, prompt for a custom RPC URL (default: `http://127.0.0.1:8545`), and leave contract addresses blank (to be filled by the deploy phase)

### Requirement: User can override the default RPC URL
The system SHALL allow the user to provide a custom RPC URL for any network selection.

#### Scenario: Override RPC for testnet or mainnet
- **WHEN** the user enters a custom RPC URL after network selection
- **THEN** the wizard SHALL use that URL instead of the default and re-run the connectivity check against it
