## ADDED Requirements

### Requirement: @cfxdevkit/keystore-server SHALL run standalone without @cfxdevkit/devnode
`@cfxdevkit/keystore-server` SHALL expose a complete keystore HTTP API with no runtime dependency on `@cfxdevkit/devnode` or any node-lifecycle package.

#### Scenario: keystore-server dependency graph contains no devnode
- **WHEN** the `package.json` of `@cfxdevkit/keystore-server` is inspected
- **THEN** `@cfxdevkit/devnode` SHALL NOT appear in `dependencies` or `peerDependencies`

#### Scenario: Standalone keystore app starts without a devnode config
- **WHEN** `createKeystoreApp(config)` is called with only keystore configuration
- **THEN** a Hono app is returned that serves `/keystore/status`, `/keystore/setup`, `/keystore/unlock`, `/keystore/lock`, `/keystore/wallets`, and `/keystore/reveal/*`

### Requirement: @cfxdevkit/devnode-server SHALL compose keystore-server rather than own keystore code
`@cfxdevkit/devnode-server` SHALL delegate all `/keystore/*` route handling to `@cfxdevkit/keystore-server`.

#### Scenario: devnode-server keystore routes are identical after refactor
- **WHEN** a client calls `/keystore/status` on a running `devnode-server` instance
- **THEN** the response is functionally identical to calling the same route on a standalone `keystore-server` instance with the same configuration
