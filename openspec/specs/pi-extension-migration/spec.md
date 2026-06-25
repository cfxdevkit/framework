# PI Extension Migration Specification

## Purpose

Repo-specific PI customizations currently living in `@cfxdevkit/pi-agent` (TypeScript wrapper, ~500 lines) SHALL be migrated into the `@cfxdevkit/pi-customization` pi package. This package is installed globally via `pi install` (no `-l`) into `~/.pi/agent/`.

## Requirements

### Requirement: pi-customization IS a valid pi package

The package SHALL conform to PI's package specification.

#### Scenario: pi-customization has pi manifest

- **WHEN** `repos/cfx-tools/infra/pi-customization/package.json` is loaded
- **THEN** it contains a `pi` key with `"extensions": ["./dist/index.js"]`
- **THEN** it contains `"pi-package"` in the `keywords` array

#### Scenario: pi-customization has peer dependencies

- **WHEN** `repos/cfx-tools/infra/pi-customization/package.json` is loaded
- **THEN** it declares `@earendil-works/pi-coding-agent` as peerDependency
- **THEN** it declares `@earendil-works/pi-tui` as peerDependency
- **THEN** it declares `typebox` as peerDependency

#### Scenario: pi-customization builds with vite

- **WHEN** `vite build` is run in the package directory
- **THEN** it produces `dist/index.js` and `dist/index.d.ts`
- **THEN** the build completes without errors

### Requirement: Repo commands ARE registered via pi-customization

Commands previously registered by `registerPiCdkCommands()` and `registerPiRepoCommands()` SHALL be registered in the pi-customization extension.

#### Scenario: Commit workflow command IS available in PI

- **WHEN** PI session starts with pi-customization loaded
- **THEN** the commit workflow command IS registered
- **THEN** invoking it calls `executePiCommitSession()` from `@cfxdevkit/llm-agents`

#### Scenario: Repo action runner IS available in PI

- **WHEN** PI session starts with pi-customization loaded
- **THEN** the action runner tool IS registered
- **THEN** invoking `repo_run_action` with an action ID executes the typed workflow

#### Scenario: CDK commands ARE removed from PI

- **WHEN** PI loads its command catalog
- **THEN** `cdk agent` command IS NOT present
- **WHEN** `cdk` namespace IS invoked
- **THEN** it routes through `tooling-cli` (non-agent commands only: `cdk repo`, `cdk contracts`, etc.)

### Requirement: Provider bridge DOES NOT read config files directly

The extension SHALL use PI's built-in provider resolution, NOT read `.pi/providers.json` directly.

#### Scenario: Extension uses PI's built-in provider

- **WHEN** the extension needs provider info
- **THEN** it uses `ctx.model` or PI's built-in resolution
- **THEN** it does NOT call `readFileSync('.pi/providers.json')`
- **THEN** it does NOT call `readFileSync('providers.json')`
- **THEN** it does NOT resolve provider config from any file path

#### Scenario: Scope-based config resolution IS removed

- **WHEN** PI loads provider config
- **THEN** `CFXDEVKIT_PI_SCOPE` env var IS NOT consulted
- **THEN** there is NO scope-based provider resolution

### Requirement: UI state widgets ARE migrated to pi-customization

UI state management from `ui.ts` in pi-agent SHALL be in the pi-customization package.

#### Scenario: Progress tracking IS available

- **WHEN** a long-running operation is triggered
- **THEN** `setPiWorkflowProgress` updates the UI widget
- **THEN** `clearPiWorkflowProgress` clears it

#### Scenario: Gate UI IS available

- **WHEN** `executePiCommitSession()` encounters a gate
- **THEN** `createPiGateUiState` renders the gate widget
- **THEN** the gate blocks until approved or dismissed

#### Scenario: Action catalog IS available

- **WHEN** `repo_action_catalog` tool is invoked
- **THEN** the catalog displays available repo actions
- **THEN** actions are fetched from `@cfxdevkit/llm-agents`

### Requirement: Runtime wrappers (interactive, print, RPC) ARE removed from pi-customization

`runPiInteractive()`, `runPiPrint()`, and `runPiRpc()` from `pi-agent/src/runtime.ts` SHALL NOT exist in pi-customization.

#### Scenario: PI interactive mode works without wrapper

- **WHEN** `pi` is run without flags
- **THEN** PI enters interactive mode natively
- **THEN** the pi-customization extension hooks into `session_start`

#### Scenario: PI print mode works without wrapper

- **WHEN** `pi -p "explain the changes"` is run
- **THEN** PI enters print mode natively
- **THEN** no subprocess spawning occurs

#### Scenario: PI RPC mode works without wrapper

- **WHEN** `pi --mode rpc` is run
- **THEN** PI enters RPC mode natively
- **THEN** no subprocess spawning occurs

### Requirement: llm-agents runtime integration IS preserved

The `getActionDefinitions()` from `@cfxdevkit/llm-agents` SHALL be imported directly.

#### Scenario: pi-customization imports from llm-agents directly

- **WHEN** `pi-customization/src/index.ts` is examined
- **THEN** it imports `getActionDefinitions` from `@cfxdevkit/llm-agents`
- **THEN** it does NOT import from `@cfxdevkit/pi-agent`
- **THEN** it does NOT import from `llm-agents-runtime.ts`

### Requirement: pi-customization DOES NOT use relative paths to repo internals

The package SHALL NOT reference `../../repos/cfx-tools/...` relative paths.

#### Scenario: pi-customization imports ARE resolved via workspace or npm

- **WHEN** pi-customization imports from `@cfxdevkit/llm-agents`
- **THEN** the import uses the package name, not a relative path
- **WHEN** pi-customization references config files
- **THEN** it uses PI's built-in resolution (NOT direct file reads)

### Requirement: pi-customization extension follows PI extension patterns

The extension SHALL follow PI's recommended extension patterns.

#### Scenario: extension exports default factory function

- **WHEN** `pi-customization/src/index.ts` is loaded
- **THEN** it exports a default function that receives `ExtensionAPI`
- **THEN** the function is synchronous or async (returns Promise)

#### Scenario: extension uses pi.registerTool/registerCommand

- **WHEN** the extension is loaded by PI
- **THEN** it calls `pi.registerTool()` for custom tools
- **THEN** it calls `pi.registerCommand()` for commands
- **THEN** it uses `pi.on()` for event subscriptions
