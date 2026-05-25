## ADDED Requirements

### Requirement: client-only-devnode-coupling
`mcp-server` and `vscode-extension` must not import from `@cfxdevkit/devnode-server`.
All devnode control-plane operations must go through `ConfluxDevkitClient` pointing at
an external URL.

#### Scenario: mcp-server package manifest
- **WHEN** `mcp-server/package.json` is read
- **THEN** `@cfxdevkit/devnode-server` does not appear in any dependency field

#### Scenario: vscode-extension package manifest
- **WHEN** `vscode-extension/package.json` is read
- **THEN** `@cfxdevkit/devnode-server` does not appear in any dependency field

#### Scenario: no createDevnodeServerApp in consumers
- **WHEN** `mcp-server/src/` and `vscode-extension/src/` are scanned for `createDevnodeServerApp`
- **THEN** zero occurrences are found

### Requirement: devnode-server-split
The `devnode-server` package must be split into `devnode-core` and `devnode-full`.

#### Scenario: devnode-core deps
- **WHEN** `devnode-core/package.json` is read
- **THEN** `dependencies` contains exactly: `@cfxdevkit/cdk`, `@cfxdevkit/devnode`,
  `@cfxdevkit/compiler`, `@cfxdevkit/contracts`

#### Scenario: devnode-full deps
- **WHEN** `devnode-full/package.json` is read
- **THEN** `dependencies` contains `@cfxdevkit/devnode-core`, `@cfxdevkit/keystore-server`,
  `@cfxdevkit/services`, `@cfxdevkit/wallet`

### Requirement: extension-spawns-devnode-full
The VS Code extension must spawn `devnode-full` as a child process and connect to it
via `ConfluxDevkitClient`. It must not call `createDevnodeServerApp` directly.

#### Scenario: extension connects to spawned server
- **WHEN** the extension activates with no `CFXDEVKIT_DEVNODE_SERVER_URL` set
- **THEN** it spawns a `devnode-full` child process and connects `ConfluxDevkitClient`
  to its port

### Requirement: mcp-server-external-url
`mcp-server` must connect to an external devnode-server URL. When neither
`CFXDEVKIT_DEVNODE_SERVER_URL` nor a reachable default port is available, it must
exit with a clear error message.

#### Scenario: no server reachable
- **WHEN** `mcp-server` starts and the devnode-server control plane is not reachable
- **THEN** it logs "devnode-server not reachable at <url>. Start it with: cdk devnode start" and exits 1
