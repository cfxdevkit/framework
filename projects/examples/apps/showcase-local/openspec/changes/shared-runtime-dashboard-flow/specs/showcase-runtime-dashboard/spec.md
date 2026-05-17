## ADDED Requirements

### Requirement: Dashboard behavior follows backend lifecycle state
showcase-local SHALL render its main runtime workspace according to backend lifecycle state instead of presenting all runtime controls at once.

#### Scenario: Blank-state onboarding
- **WHEN** the backend reports that no keystore exists
- **THEN** the dashboard guides the user through keystore setup, wallet generation or import, and fixed account-count selection before exposing later runtime controls

#### Scenario: Locked-state entry
- **WHEN** the backend reports that a keystore exists but is locked
- **THEN** the dashboard presents unlock as the primary action and shows reset guidance as a destructive recovery path

#### Scenario: Active runtime workspace
- **WHEN** the backend reports an unlocked keystore with an active wallet
- **THEN** the dashboard reveals the remaining runtime functions such as network selection, local node controls, compiler, deploy, wallet management, and app-specific backend extension examples

### Requirement: Local node controls appear only when relevant
showcase-local SHALL present local node status and control actions only when backend-owned network state makes them relevant.

#### Scenario: Local runtime controls in local mode
- **WHEN** the backend network profile is set to `local`
- **THEN** the dashboard shows local node status and control actions including start, stop, and wipe alongside other runtime context

#### Scenario: Public runtime mode hides local-only control emphasis
- **WHEN** the backend network profile is set to a public network
- **THEN** the dashboard does not present local-node control actions as primary runtime actions

### Requirement: Operation log is contextual and contained
showcase-local SHALL present operation feedback as a contained part of the dashboard footer or control surface rather than as a disconnected page element.

#### Scenario: Log emphasizes user-triggered operations
- **WHEN** runtime actions such as setup, unlock, deploy, wallet activation, or node control complete or fail
- **THEN** the log presents the resulting operational outcome instead of flooding the user with repeated passive load messages

#### Scenario: Log controls stay with log content
- **WHEN** the dashboard renders runtime log content
- **THEN** any clear, collapse, or related log controls are presented in the same footer/log object rather than split across separate page regions

### Requirement: Wallet management remains available after onboarding
showcase-local SHALL include a wallet-management section after onboarding so users can add mnemonic roots, switch the active wallet, and inspect the derived-account inventory.

#### Scenario: Manage wallets after initial setup
- **WHEN** the user reaches the active runtime workspace
- **THEN** the dashboard still provides wallet management actions without forcing the user back through first-run onboarding
