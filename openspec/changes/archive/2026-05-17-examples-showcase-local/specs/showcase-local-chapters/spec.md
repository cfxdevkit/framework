## ADDED Requirements

### Requirement: Showcase-local provides one backend-management workspace

The `/` route SHALL provide a single workspace for local runtime and wallet management instead of separate live chapter pages. Legacy chapter routes MAY continue to exist only as redirects to `/`.

#### Scenario: User opens a legacy chapter route
WHEN the user navigates to `/devnode`, `/keystore`, `/session-key`, `/compiler`, or `/deploy`
THEN the route redirects to `/` and the workspace remains the only live showcase surface

#### Scenario: Workspace covers all operational areas
WHEN the workspace loads
THEN the user can reach network, node, wallet, account, contract, compiler, session-key, and custom-operation flows without leaving the single workspace

### Requirement: Workspace navigation mirrors a VS Code-style tree

The workspace SHALL organize operations through one unified tree-structured left rail similar to the VS Code extension mental model. The tree SHALL expose network selection, wallet roots, derived accounts, node controls, and tracked contracts as first-class branches or leaves.

#### Scenario: User selects a network or resource leaf
WHEN the user selects a tree item for a network, wallet, account, node, or contract
THEN the main pane updates to show the backend-backed details for that selected resource

#### Scenario: Contracts are grouped by environment
WHEN the user expands tracked contracts in the tree
THEN contracts are shown within the currently selected network and space context rather than as one flat global list

#### Scenario: Tree logic can be shared across consumers
WHEN the showcase models a network, wallet, account, node, or contract branch
THEN the resource organization follows the same command and state model as the VS Code extension rather than introducing a showcase-specific tree structure

### Requirement: The first showcase pass exposes the complete agreed operational surface

The first workspace implementation SHALL expose the complete agreed operational surface for the shared backend-facing showcase rather than placeholder branches or partial demos.

#### Scenario: User selects an operational branch
WHEN the user selects a branch or leaf for a supported feature in the workspace
THEN the corresponding operation is backed by a real backend capability and is not presented as a placeholder

### Requirement: Mutating operations use modals to avoid clutter

The workspace SHALL open modal or command-sheet flows for state-changing operations such as setup, unlock, import, rename, reveal, fund, deploy, call, send, and custom extension actions.

#### Scenario: Wallet mutation is initiated
WHEN the user triggers create, import, rename, delete, reveal, or activate from a wallet-related tree item or detail view
THEN the operation is completed through a modal flow instead of an always-visible inline form stack

#### Scenario: Contract interaction is initiated
WHEN the user chooses a deploy, call, or send operation for a tracked contract
THEN the required inputs are collected in a focused modal and the result is returned to the workspace detail pane and shared log

### Requirement: The main pane stays focused on selected resource state

The main pane SHALL primarily show resource summaries, backend state, ABI/context detail, and operation results for the selected tree item.

#### Scenario: User selects a wallet account
WHEN an account leaf is selected
THEN the main pane shows derived addresses, relevant balances, signer status, and available backend-managed actions for that account

#### Scenario: User selects a tracked contract
WHEN a contract leaf is selected
THEN the main pane shows network, space, address, ABI-driven actions, and recent operation output for that contract

### Requirement: First-pass contract tracking is limited to deployed contracts

The first workspace pass SHALL track deployed contracts only.

#### Scenario: User opens the contracts branch
WHEN the contracts tree is displayed
THEN it shows contracts deployed through the shared backend workflows for the selected environment; manual contract import is not required for the first pass

### Requirement: The workspace keeps a shared operational log visible

The workspace SHALL maintain an always-visible or persistently reachable event log that shows actions and results across setup, node, keystore, contract, compiler, session-key, and custom extension flows.

#### Scenario: Multiple operations are performed across the workspace
WHEN the user runs actions in different resource areas
THEN the shared log preserves the sequence of events so the workflow remains understandable end to end

### Requirement: Showcase-local demonstrates backend extensibility

The workspace SHALL include one example of a project-defined custom backend operation that extends the shared runtime and is callable both from the UI and programmatically.

#### Scenario: User invokes a custom project operation
WHEN the user selects the custom operation entry in the workspace and completes its modal flow
THEN the action calls the attached backend route, returns structured results, and demonstrates how downstream projects can extend the backend without moving logic into the UI

#### Scenario: The custom operation returns the current block number
WHEN the user invokes the first showcase-specific backend extension example
THEN the backend returns the current block number through the custom route and the workspace displays the result in the detail pane and shared log
