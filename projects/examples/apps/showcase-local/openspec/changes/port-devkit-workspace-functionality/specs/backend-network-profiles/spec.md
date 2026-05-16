## ADDED Requirements

### Requirement: Wallet-scoped network profiles
The backend SHALL persist a network profile for the active wallet and SHALL reload that profile whenever the active wallet context is restored.

#### Scenario: Load default profile for a wallet without saved network state
- **WHEN** the backend activates a wallet that has no persisted network profile
- **THEN** it returns a `local` network mode with no public RPC overrides and uses configured local chain IDs as the effective chain IDs

#### Scenario: Restore persisted public profile for the active wallet
- **WHEN** the backend activates a wallet that has a persisted public network profile
- **THEN** it loads the saved mode, public RPC URLs, and saved chain ID overrides before serving network-dependent operations

### Requirement: Backend-owned network mode controls runtime behavior
The backend SHALL treat network mode as backend-owned control-plane state used by deploy, contract, and funding operations.

#### Scenario: Reject switching to public mode while local node is running
- **WHEN** a client requests a network profile update that changes mode to `public` while the local devnode is running
- **THEN** the backend rejects the change with an error that instructs the client to stop the node first

#### Scenario: Reject local node start while backend is in public mode
- **WHEN** a client requests local node startup while the active wallet network profile is set to `public`
- **THEN** the backend rejects the request and explains that the runtime must return to `local` mode first

### Requirement: Public signer resolution precedence
The backend SHALL resolve the signer for public-network write operations using deterministic precedence.

#### Scenario: Prefer environment signer override
- **WHEN** a public-network write operation is requested and a chain-specific or generic environment private key override is configured
- **THEN** the backend uses the environment override as the signer and reports the signer source as `env`

#### Scenario: Fall back to request signer override
- **WHEN** a public-network write operation is requested without an environment override but with a request-provided private key
- **THEN** the backend uses the request-provided private key as the signer and reports the signer source as `request`

#### Scenario: Fall back to active keystore account
- **WHEN** a public-network write operation is requested without an environment or request signer override
- **THEN** the backend derives the signer from the active keystore wallet account index and reports the signer source as `keystore`

### Requirement: Network capabilities are discoverable
The backend SHALL expose effective network capabilities so consumers can determine whether local and public contract operations are currently available.

#### Scenario: Report public capability availability from configured RPC endpoints
- **WHEN** a client requests backend network capabilities
- **THEN** the backend reports whether public Core Space and eSpace operations are available based on the active wallet network profile configuration
