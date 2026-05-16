## ADDED Requirements

### Requirement: Tracked contract deployments across local and public networks
The backend SHALL deploy contracts as tracked backend resources on both local and public networks for Core Space and eSpace.

#### Scenario: Deploy tracked contract on local eSpace or Core Space
- **WHEN** a client requests deployment in local mode for a supported chain family
- **THEN** the backend deploys using the active local wallet account, records the tracked contract, and returns its address, transaction hash, chain family, and tracked identifier

#### Scenario: Deploy tracked contract on public network
- **WHEN** a client requests deployment in public mode for a supported chain family
- **THEN** the backend uses the resolved public signer, deploys to the configured public RPC endpoint, records the tracked contract, and returns the signer source in the deployment result

### Requirement: Wallet-scoped persistent contract registry
The backend SHALL persist tracked and externally registered contracts per active wallet.

#### Scenario: Preserve tracked contracts across backend restart
- **WHEN** the backend restarts after tracked contracts were deployed or registered for the active wallet
- **THEN** the backend lists the same tracked contracts for that wallet without requiring redeployment or re-registration

#### Scenario: Isolate tracked contracts between wallets
- **WHEN** the active wallet changes to a different wallet context
- **THEN** the backend exposes only the tracked contracts stored for that wallet and does not mix data from another wallet

### Requirement: Tracked contract call parity
The backend SHALL support read and write operations against tracked contracts in both local and public modes.

#### Scenario: Read tracked contract in public mode
- **WHEN** a client calls a read-only function on a tracked public-network contract
- **THEN** the backend executes the read against the configured public RPC endpoint without requiring a signer

#### Scenario: Write tracked contract in local mode
- **WHEN** a client calls a state-changing function on a tracked local contract
- **THEN** the backend sends the transaction from the selected local account and performs any required local mining or confirmation handling before returning the result

#### Scenario: Write tracked contract in public mode
- **WHEN** a client calls a state-changing function on a tracked public-network contract
- **THEN** the backend resolves the signer using public signer precedence, sends the transaction to the configured public RPC endpoint, and returns the transaction hash with signer metadata

### Requirement: Tracked contract metadata captures execution context
The backend SHALL store enough metadata for consumers to understand how a tracked contract was deployed and how it should be called.

#### Scenario: Store deployment metadata for tracked contract
- **WHEN** the backend records a tracked deployment or external registration
- **THEN** it stores the contract name, address, chain family, chain ID, deployment time, deployer, ABI, constructor arguments, and any network-mode metadata needed for later calls
