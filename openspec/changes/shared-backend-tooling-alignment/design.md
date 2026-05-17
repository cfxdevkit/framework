## Context

The repo already contains the pieces of a shared control plane: `devnode-server` exposes the backend routes and `client` already exposes typed namespaces for node, network, keystore, deploy, and contract flows. The remaining gap is consumer alignment. The extension and MCP server still hold direct `@cfxdevkit/devnode` assumptions, while their docs already promise the shared backend contract.

## Goals / Non-Goals

**Goals:**
- Make the extension and MCP server consume `devnode-server` through `@cfxdevkit/client`.
- Ensure the client and backend surface fully cover the operations those consumers need.
- Prove the shared path with smoke coverage and aligned docs.

**Non-Goals:**
- Redesigning the extension or MCP UX.
- Replacing `devnode-server` with a different control-plane abstraction.
- Preserving duplicate in-process runtime ownership in the consumers.

## Decisions

- Treat `@cfxdevkit/devnode-server` as the single runtime owner and `@cfxdevkit/client` as the single typed integration API for tooling consumers.
- Audit the current route and client surface first, then add only the missing backend or client pieces required for parity with the consumer command sets.
- Migrate the extension and MCP server by behavior slice and keep smoke coverage ahead of deleting any direct `devnode` paths.

## Risks / Trade-offs

- [Consumer migration exposes missing backend surface] → Close route and client gaps before deleting the direct in-process path.
- [Tooling semantics drift during migration] → Preserve network, keystore, deploy, and contract semantics from the documented shared contract.
- [Docs stay ahead of implementation again] → Update package docs in the same change that lands the migrated behavior.
