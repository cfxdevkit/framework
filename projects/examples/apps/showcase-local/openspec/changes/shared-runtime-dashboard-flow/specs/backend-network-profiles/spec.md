## MODIFIED Requirements

### Requirement: Backend-owned network mode controls runtime behavior
The backend SHALL treat network mode as backend-owned control-plane state used by deploy, contract, funding, and other runtime operations, and all consumers SHALL treat the backend profile as the authoritative source of current network state.

#### Scenario: Reject switching to public mode while local node is running
- **WHEN** a client requests a network profile update that changes mode to `public` while the local devnode is running
- **THEN** the backend rejects the change with an error that instructs the client to stop the node first

#### Scenario: Reject local node start while backend is in public mode
- **WHEN** a client requests local node startup while the active wallet network profile is set to `public`
- **THEN** the backend rejects the request and explains that the runtime must return to `local` mode first

#### Scenario: Consumer reads authoritative backend network profile
- **WHEN** multiple consumers are attached to the same backend and one consumer changes the selected network
- **THEN** any consumer that reads the current network profile receives the same backend-owned effective state instead of a consumer-local approximation
