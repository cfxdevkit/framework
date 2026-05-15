## ADDED Requirements

### Requirement: Devnode API routes manage DevNode lifecycle

The `/api/devnode/start`, `/api/devnode/stop`, and `/api/devnode/mine` routes SHALL manage the `DevNode` singleton from `@cfxdevkit/devnode`. All routes SHALL declare `export const runtime = 'nodejs'`.

#### Scenario: Start creates and starts the DevNode singleton
WHEN POST `/api/devnode/start` is called and no DevNode is running
THEN `createDevNode()` is called, `devNode.start()` resolves, and `{ status: 'running', rpcUrl: string }` is returned

#### Scenario: Start is idempotent when already running
WHEN POST `/api/devnode/start` is called and a DevNode is already running
THEN `{ status: 'running', rpcUrl: string }` is returned without starting a second process

#### Scenario: Stop halts the DevNode
WHEN POST `/api/devnode/stop` is called
THEN `devNode.stop()` is called and `{ status: 'stopped' }` is returned

#### Scenario: Mine produces blocks
WHEN POST `/api/devnode/mine` is called with `{ count: 5 }`
THEN the devnode mines 5 blocks and `{ blockNumber: number }` is returned

#### Scenario: Status endpoint returns current state
WHEN GET `/api/devnode/status` is called
THEN `{ status: 'running' | 'stopped', blockNumber?: number }` is returned

### Requirement: Keystore API routes manage accounts

The `/api/keystore/*` routes SHALL manage accounts using `@cfxdevkit/services` file keystore provider. All routes SHALL declare `export const runtime = 'nodejs'`.

#### Scenario: Create account returns new address
WHEN POST `/api/keystore/accounts` is called with `{ label?: string }`
THEN a new account is created, stored in the keystore, and `{ address: string }` is returned

#### Scenario: List accounts returns all addresses
WHEN GET `/api/keystore/accounts` is called
THEN an array of `{ address: string, label?: string }` objects is returned

### Requirement: Session key API route issues attestations

The `/api/session-key/issue` route SHALL use `createSessionKey()` and `signerFromKeystore()` from `@cfxdevkit/wallet` to issue a capability-scoped attestation JWT. The route SHALL declare `export const runtime = 'nodejs'`.

#### Scenario: Attestation is issued for a managed signer
WHEN POST `/api/session-key/issue` is called with `{ signerAddress, policy: { allowedContracts, allowedMethods, spendLimit? } }`
THEN a session key is created and an attestation JWT is returned

### Requirement: Compile API routes run solc

The `/api/compile/contract` POST route and `/api/compile/status` GET route SHALL use `@cfxdevkit/compiler`'s `compile()` and `ensureSolc()`. All routes SHALL declare `export const runtime = 'nodejs'`.

#### Scenario: Compile returns ABI and bytecode
WHEN POST `/api/compile/contract` is called with `{ source: string, contractName: string }`
THEN `compile(source, contractName)` is called and `{ abi, bytecode }` is returned

#### Scenario: Status returns ready when solc is available
WHEN GET `/api/compile/status` is called and `ensureSolc()` has completed
THEN `{ ready: true, version: string }` is returned

### Requirement: Deploy API routes deploy and interact

The `/api/deploy/contract`, `/api/deploy/call`, and `/api/deploy/send` routes SHALL deploy contracts and execute calls/sends using `@cfxdevkit/wallet`'s managed signer against the local devnode RPC. All routes SHALL declare `export const runtime = 'nodejs'`.

#### Scenario: Contract is deployed and address returned
WHEN POST `/api/deploy/contract` is called with `{ abi, bytecode, constructorArgs?, signerAddress }`
THEN the contract is deployed via the managed signer and `{ address: string, txHash: string }` is returned

#### Scenario: Read call returns decoded result
WHEN POST `/api/deploy/call` is called with `{ contractAddress, abi, method, args }`
THEN the function is called and the decoded return value is returned as `{ result: unknown }`

#### Scenario: Write send returns receipt
WHEN POST `/api/deploy/send` is called with `{ contractAddress, abi, method, args, signerAddress }`
THEN the transaction is signed by the managed signer, submitted, and `{ txHash: string, receipt: object }` is returned
