# Showcase Coverage

The supported showcase suite is split across the two keeper apps:
`showcase-local` for the shared local/backend control plane and
`showcase-public` for browser-only public SDK demos.

| Area | Packages | Covered By | Notes |
| --- | --- | --- | --- |
| Core runtime | `@cfxdevkit/core`, `@cfxdevkit/protocol`, `@cfxdevkit/devnode-server`, `@cfxdevkit/client` | `showcase-local`, `showcase-public` | dual-space clients, local control plane, Core/eSpace RPC, address/unit helpers |
| Keys and wallets | `@cfxdevkit/services`, `@cfxdevkit/wallet` | `showcase-local`, `showcase-public` | file keystore, browser wallets, memory wallet, Ledger, OneKey, and Satochip-oriented public demos |
| Solidity | `@cfxdevkit/contracts`, `@cfxdevkit/compiler`, `@cfxdevkit/abis` | `showcase-local`, `showcase-public` | template catalog, compile/deploy flows, ABI read/write, tracked contract calls |
| Shared example UI | `@cfxdevkit/example-showcase-ui` | keeper showcase apps | shared UI primitives, code snippets, status badges, and log widgets |
| UI packages | `@cfxdevkit/theme`, `@cfxdevkit/react`, `@cfxdevkit/defi-react`, `@cfxdevkit/wallet-connect` | `showcase-public` | public component and wallet-connect demos |
| Tools | `@cfxdevkit/cli`, `@cfxdevkit/create`, `@cfxdevkit/mcp-server`, `@cfxdevkit/llm-tools` | docs / release validation | DX tooling is validated outside the retired example apps |
| Domain packages | `@cfxdevkit/automation`, `@cfxdevkit/game-engine` | project docs / future examples | domain-specific examples can be added after release-critical showcase coverage remains stable |

## Rewrite Principles

- Keep only `showcase-local` and `showcase-public` as supported showcase surfaces.
- Put common controls in `@cfxdevkit/example-showcase-ui` before duplicating them in keeper apps.
- Keep each app linear and scoped: local backend control plane in `showcase-local`, public browser SDK demos in `showcase-public`.
