## ADDED Requirements

### Requirement: Showcase-local same-origin routes are thin adapters over the shared runtime

The `/api/*` routes in showcase-local SHALL act as browser-facing adapters over the canonical local-runtime control plane. They SHALL not own a second runtime implementation. All stateful runtime routes SHALL declare `export const runtime = 'nodejs'`.

#### Scenario: App route delegates a runtime action
WHEN the browser calls a showcase-local runtime route
THEN the route forwards the request to the shared control plane and returns the canonical response shape rather than re-implementing the operation locally

### Requirement: Backend owns wallet and account logic

Wallet roots, derived accounts, active account selection, reveal flows, funding flows, and signer resolution SHALL be owned by the backend. The UI SHALL call backend routes for these behaviors instead of deriving or mutating account state locally.

#### Scenario: User selects or reveals an account
WHEN the UI needs account activation, derived account details, or protected secret reveal behavior
THEN the request is served through backend-owned logic exposed by the shared control plane

### Requirement: Showcase-local adapters expose the full reusable command surface

The showcase-local app SHALL expose thin adapters for the shared command families needed by the workspace: network selection, node lifecycle, wallet and account management, deployed-contract tracking, compiler/template flows, session-key flows, deploy/interact flows, funding/account hooks needed by the backend model, and custom extension routes.

#### Scenario: Compiler, session-key, or deploy action is triggered
WHEN the browser calls `/api/compile/*`, `/api/session-key/*`, or `/api/deploy/*`
THEN those routes proxy to the shared runtime surface instead of owning bespoke implementation logic inside the app

#### Scenario: Contract interaction is triggered
WHEN the browser calls a contract read or write action
THEN the request includes explicit network and space context and the backend returns a structured result compatible with the shared client contract

### Requirement: First-pass contract adapters focus on deployed contract workflows

The first showcase-local adapter pass SHALL focus on deployed contract workflows rather than generic manual contract import.

#### Scenario: Browser requests tracked contracts
WHEN the browser asks for tracked contracts in the current environment
THEN the adapter returns deployed contracts produced through the shared backend workflows for that environment

### Requirement: Contract operations are network-aware and space-aware

Contract list, deploy, import, read, and write routes SHALL preserve selected network and selected space as first-class request context.

#### Scenario: User switches environment
WHEN the selected network or space changes
THEN subsequent contract operations and tracked contract results are scoped to that environment instead of leaking across unrelated networks

### Requirement: Showcase-local can expose project-specific runtime extensions

The app SHALL be able to mount custom runtime-backed routes that reuse shared services and remain callable programmatically.

#### Scenario: Project defines a custom route
WHEN a project attaches a custom showcase route on top of the shared runtime app
THEN that route can reuse shared backend state and services and is invokable both through the browser-facing adapter layer and through direct programmatic clients

#### Scenario: The first custom route returns block number
WHEN the showcase mounts its first custom runtime extension route
THEN that route returns the current block number through the shared backend model and remains callable both from the UI and other programmatic consumers

### Requirement: Command payloads align with extension and MCP consumers

Showcase-local runtime adapters SHALL use payload and response shapes that can also support the VS Code extension and MCP consumers.

#### Scenario: Another consumer adopts the same backend route
WHEN the VS Code extension or MCP needs the same operation family
THEN the operation can reuse the same command model and backend semantics instead of requiring a showcase-specific translation layer
