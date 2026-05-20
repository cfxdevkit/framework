## 1. Surface Audit

- [x] 1.1 Map the extension and MCP command/tool surface onto the current `devnode-server` routes and `client` namespaces.
- [x] 1.2 Identify any missing backend routes or client methods required for parity.
	- See `surface-audit.md`; no backend route gaps were found for the current parity target. Missing typed client surface: health, keystore reveal, and bootstrap.

## 2. Shared Control-Plane Completion

- [x] 2.1 Add any missing `devnode-server` routes needed by the extension or MCP server.
	- Audit found no missing backend routes for the current parity target.
- [x] 2.2 Add or finish the matching `@cfxdevkit/client` methods for those routes.
	- Added typed health, keystore reveal, and bootstrap client methods for existing backend routes.

## 3. Consumer Migration

- [x] 3.1 Replace direct `@cfxdevkit/devnode` control paths in the MCP server with `@cfxdevkit/client` calls.
	- MCP node, accounts, chain resources, compiler/deploy, blockchain writes, keystore, and wallet signing now route through the shared client/control-plane bridge.
- [x] 3.2 Replace direct `@cfxdevkit/devnode` control paths in the VS Code extension with `@cfxdevkit/client` calls.
	- Extension node lifecycle/mining and smoke workflows now use the shared client with an embedded or external `devnode-server` control plane.
- [x] 3.3 Remove obsolete direct `@cfxdevkit/devnode` dependencies from consumer package manifests once the shared client path is complete.
	- MCP and VS Code extension manifests now depend on `@cfxdevkit/client` and `@cfxdevkit/devnode-server` instead of direct `@cfxdevkit/devnode`.

## 4. Validation and Docs

- [x] 4.1 Add smoke coverage for node, network, keystore, deploy, contract, and account flows through the shared client/backend path.
	- Added/updated client namespace tests and extension smoke coverage, including local deployment through `client.deploy.run`.
- [x] 4.2 Update the extension and MCP docs so they describe the implemented runtime model accurately.
- [x] 4.3 Run the affected package validation after the migration lands.
	- Passed client typecheck/tests, MCP typecheck/tests/build, extension typecheck/build, and extension workflow/deploy smoke scripts.
- [x] 4.4 Verify the extension and MCP package APIs no longer imply a second tool-owned runtime model.
	- Source/package/doc checks now show shared client plus `devnode-server` runtime ownership instead of direct consumer-owned devnode paths.
