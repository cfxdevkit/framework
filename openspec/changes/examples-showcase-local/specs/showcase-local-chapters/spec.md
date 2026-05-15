## ADDED Requirements

### Requirement: Devnode chapter manages local node lifecycle

The `/devnode` route SHALL allow the user to start, stop, and mine blocks on a local Conflux devnode via the UI. The chapter SHALL display real-time node status (running/stopped), current block number, and a mining trigger.

#### Scenario: Start devnode
WHEN the user clicks "Start Devnode" and no devnode is running
THEN POST `/api/devnode/start` is called, the node process starts, and the status badge changes to "running"

#### Scenario: Stop devnode
WHEN the user clicks "Stop Devnode" and a devnode is running
THEN POST `/api/devnode/stop` is called, the node process exits, and the status badge changes to "stopped"

#### Scenario: Mine blocks on demand
WHEN the user enters a block count (1–100) and clicks "Mine"
THEN POST `/api/devnode/mine` is called, the specified number of blocks are mined, and the new block number is displayed in a LogBox entry

#### Scenario: Binary not found shows error state
WHEN the devnode page loads and `@cfxdevkit/devnode` binary is not executable
THEN a StatusBadge with "error" state and a message explaining the binary requirement is shown

### Requirement: Keystore chapter manages accounts

The `/keystore` route SHALL allow the user to switch between memory and file keystore providers, create new accounts, list accounts, and view account details.

#### Scenario: New account is created
WHEN the user clicks "Create Account" with an optional label
THEN POST `/api/keystore/accounts` is called and the new account address is added to the accounts list

#### Scenario: Account list is displayed
WHEN the keystore page loads
THEN GET `/api/keystore/accounts` is called and all managed addresses are shown in a list with copy buttons

#### Scenario: File keystore persists across page reload
WHEN the file keystore provider is active and an account is created, then the page is reloaded
THEN the account is still present in the list (persisted to `.local-data/keystore/`)

### Requirement: Session key chapter issues attestations

The `/session-key` route SHALL allow the user to select a managed signer, define a capability policy (contract address + method selector allowlist, optional spend limit), and issue a session key attestation JWT.

#### Scenario: Session key is created
WHEN the user selects a managed account, defines a capability policy, and clicks "Issue Session Key"
THEN POST `/api/session-key/issue` is called and an attestation JWT is returned

#### Scenario: Attestation is decoded and displayed
WHEN an attestation JWT is returned from the API
THEN the decoded header, payload (signer address, policy constraints, iat, exp), and raw JWT are displayed in a DemoCard

### Requirement: Compiler chapter compiles Solidity

The `/compiler` route SHALL allow the user to select a template, edit the Solidity source, compile it, and inspect the resulting ABI and bytecode.

#### Scenario: Template is loaded into editor
WHEN the user selects "ERC-20" from the template dropdown
THEN `getTemplate('basicErc20')` source is loaded into the code editor

#### Scenario: Compilation produces ABI and bytecode
WHEN the user clicks "Compile"
THEN POST `/api/compile/contract` is called with the Solidity source and the ABI and bytecode are displayed in CodeSnippet components

#### Scenario: Compiler initialization is shown
WHEN the compiler page loads for the first time and solc is not yet downloaded
THEN a "Downloading compiler..." StatusBadge (pending) is shown until GET `/api/compile/status` returns ready

### Requirement: Deploy chapter deploys and interacts with contracts

The `/deploy` route SHALL allow the user to deploy a compiled contract (ABI + bytecode from compiler chapter or manual input) to the local devnode, and then call/send to the deployed contract.

#### Scenario: Contract is deployed
WHEN the user pastes ABI and bytecode and clicks "Deploy"
THEN POST `/api/deploy/contract` is called, the contract is deployed via managed signer, and the deployed address is displayed

#### Scenario: Read call is executed
WHEN the user selects a read function from the ABI, enters arguments, and clicks "Call"
THEN POST `/api/deploy/call` is called and the return value is displayed in a LogBox entry

#### Scenario: Write transaction is executed
WHEN the user selects a write function from the ABI, enters arguments, and clicks "Send"
THEN POST `/api/deploy/send` is called, the transaction is signed by the managed signer, and the txHash and receipt are displayed
