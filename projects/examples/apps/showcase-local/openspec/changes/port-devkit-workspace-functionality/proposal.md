## Why

The shared backend in the framework repo already has the cleaner reusable shape for showcase, VS Code, and MCP consumers, but it still lacks key backend-owned behaviors that already exist in devkit-workspace: persisted local/public network profiles, public signer resolution, durable contract tracking, and full Core/eSpace funding parity. This change brings those missing capabilities into the shared runtime so one canonical backend can manage both local devnode workflows and public-network deployment workflows.

## What Changes

- Add a backend-owned local/public network profile model to the shared runtime, including persisted public RPC URLs and effective chain IDs per active wallet.
- Add public-mode signer resolution to backend deploy and contract-operation flows, with support for environment overrides, request-provided private keys, and keystore-derived accounts.
- Add wallet-scoped persistent contract tracking so deployments and registered contracts survive backend restarts and can be reused by showcase, VS Code, and MCP consumers.
- Extend backend contract operations so tracked contracts can be deployed and called consistently on local devnode, testnet, and mainnet for both Core Space and eSpace.
- Add Core Space funding parity to the backend account funding surface instead of supporting only eSpace transfers.
- Preserve the existing richer framework capabilities for keystore account management, reveal flows, session keys, and backend extension hooks as the canonical reusable API surface.

## Capabilities

### New Capabilities
- `backend-network-profiles`: Persist and apply wallet-scoped local/public network profiles, including public RPC settings and signer resolution policy used by backend operations.
- `backend-contract-orchestration`: Track deployed and registered contracts durably and support consistent deploy and call flows across local and public Core/eSpace networks.
- `backend-account-funding`: Fund both Core Space and eSpace addresses through the shared backend with behavior suitable for local devnode workflows.

### Modified Capabilities
- None.

## Impact

- Affected code: `repos/cfx-tools/packages/devnode-server`, `repos/cfx-tools/packages/client`, showcase-local API adapters, and backend consumer documentation.
- Affected APIs: `/network`, `/deploy`, `/contracts`, `/accounts`, and any consumer-facing client methods built on those routes.
- Affected systems: local devnode control, public-network deployment flows, wallet-scoped backend state, showcase-local, VS Code extension, and MCP integration.
- Reference implementation: selected behaviors will be ported from devkit-workspace backend orchestration without adopting its product-specific Express shell, DEX runtime, or UI-specific concerns.