## ADDED Requirements

### Requirement: signer-config-file
`.cfxdevkit/signer.json` is the canonical signer configuration for a workspace.

#### Scenario: read config
- **WHEN** `readSignerConfig()` is called in a workspace that has `.cfxdevkit/signer.json`
- **THEN** it returns the parsed `SignerConfig` with `defaultSigner` and `signers` map

#### Scenario: missing config returns default
- **WHEN** `readSignerConfig()` is called and `.cfxdevkit/signer.json` does not exist
- **THEN** it returns `{ defaultSigner: 'quick', signers: { quick: { kind: 'memory' } } }`

#### Scenario: create session from config
- **WHEN** `createSignerSessionFromConfig()` is called with no name
- **THEN** it creates a session for the `defaultSigner` entry
- **THEN** the session has `eSpace` and `core` signers ready

### Requirement: memory-signer-ephemeral
The `memory` signer kind must generate a fresh key every session and never write it to disk.

#### Scenario: memory key is not persisted
- **WHEN** `createSignerSessionFromConfig()` resolves a `memory` kind entry
- **THEN** a random private key is generated via `signerFromPrivateKey(generatePrivateKey(), ...)`
- **THEN** no file is written; the private key exists only in process memory for this session

### Requirement: cdk-signer-setup-wizard
`cdk signer setup` must guide the user through signer configuration interactively.

#### Scenario: wizard creates signer.json
- **WHEN** `cdk signer setup` is run in a workspace without `.cfxdevkit/signer.json`
- **THEN** the wizard prompts: backend choice, config details (path/account for file-keystore)
- **THEN** on completion, `.cfxdevkit/signer.json` is written
- **THEN** a test sign is performed and the eSpace address is printed

#### Scenario: gitignore entry
- **WHEN** the wizard writes signer.json
- **THEN** it checks `.gitignore` and adds `.cfxdevkit/signer.json` if not already present

### Requirement: cdk-signer-status
`cdk signer status` must show the current config and resolve signer info without triggering a device prompt.

#### Scenario: status output
- **WHEN** `cdk signer status` is run
- **THEN** it prints: active signer name, kind, config details (path for file-keystore, etc.)
- **THEN** for `file-keystore`, if `CFX_PASSPHRASE` is set: it also prints the derived eSpace address

### Requirement: cdk-sign-config-fallback
`cdk sign message <msg>` must use signer config when no env vars are set.

#### Scenario: no env vars, signer.json exists
- **WHEN** `CFX_PASSPHRASE` and `CFX_KEYSTORE_PATH` are NOT set
- **AND** `.cfxdevkit/signer.json` has a `file-keystore` default signer
- **THEN** `cdk sign message "Hello"` prompts for passphrase and signs

#### Scenario: memory default signer
- **WHEN** `.cfxdevkit/signer.json` has `defaultSigner: "quick"` with `kind: "memory"`
- **THEN** `cdk sign message "Hello"` uses an ephemeral key and prints a warning

### Requirement: vscode-signer-reads-config
The VS Code extension must read the active signer from signer.json.

#### Scenario: extension reads signer.json
- **WHEN** the VS Code extension activates in a workspace with `.cfxdevkit/signer.json`
- **THEN** `selectedBackend()` returns the `kind` of the `defaultSigner` entry
- **THEN** `selectedFileRef()` reads the `service` / `account` from the file-keystore entry

#### Scenario: no signer.json
- **WHEN** `.cfxdevkit/signer.json` does not exist
- **THEN** `selectedBackend()` returns `'file'` (existing behaviour, unchanged)

### Requirement: mcp-signer-tools
The MCP server must expose signer config tools.

#### Scenario: status tool
- **WHEN** `cfxdevkit_signer_status` is called
- **THEN** it returns the current signer name, kind, and address (if resolvable without hardware)

#### Scenario: setup tool
- **WHEN** `cfxdevkit_signer_setup` is called with `kind: "file-keystore"` and required params
- **THEN** `.cfxdevkit/signer.json` is written
- **THEN** the response confirms the signer name and addresses

### Requirement: showcase-setup-wizard
The showcase `/keys/setup` page must provide a browser wizard for demo signer selection.

#### Scenario: wizard persists to localStorage
- **WHEN** the user completes the setup wizard on `/keys/setup`
- **THEN** the chosen signer kind is stored in `localStorage` under `cfxdevkit.demoSigner`
- **THEN** the memory, ledger, and onekey demo panels read this preference on load

#### Scenario: setup link on overview
- **WHEN** the `/keys` overview page renders
- **THEN** a "Configure demo signer →" link to `/keys/setup` is visible
