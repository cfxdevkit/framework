# Showcase Coverage

The showcase suite is a linear walkthrough behind `pnpm showcase` and
`http://127.0.0.1:5173`.

| Area | Packages | Covered By | Notes |
| --- | --- | --- | --- |
| Core runtime | `@cfxdevkit/core`, `@cfxdevkit/protocol`, `@cfxdevkit/devnode` | `/showcase/`, `/stack/` | dual-space clients, local devnode, Core/eSpace RPC proxy, address/unit helpers |
| Keys and wallets | `@cfxdevkit/services`, `@cfxdevkit/wallet` | `/showcase/`, `/browser/`, `/hardware/` | memory/file/Ledger keystore management, browser wallets, Fluent providers, future OneKey/Satochip slots |
| Solidity | `@cfxdevkit/contracts`, `@cfxdevkit/compiler`, `@cfxdevkit/abis` | `/showcase/`, `/stack/`, `/hardware/` | template catalog, compile endpoints, ABI read/write console, deploy flows through managed signers |
| Shared example UI | `@cfxdevkit/example-showcase-ui` | all showcase apps | shared theme, gateway navigation, panel sidebar state, backend/devnode controls |
| UI packages | `@cfxdevkit/theme`, `@cfxdevkit/react`, `@cfxdevkit/defi-react`, `@cfxdevkit/wallet-connect` | partial | shared showcase theme is in place; dedicated component demos still need to be added |
| Tools | `@cfxdevkit/cli`, `@cfxdevkit/create`, `@cfxdevkit/mcp-server`, `@cfxdevkit/llm-tools` | gap | add CLI/scaffold and LLM automation demos or documentation panels |
| Domain packages | `@cfxdevkit/automation`, `@cfxdevkit/game-engine`, `@cfxdevkit/hardware-bridge` | gap | add domain-specific examples after the core wallet/backend path remains stable |

## Rewrite Principles

- Keep `showcase-gateway` as the only public development URL.
- Put common controls in `@cfxdevkit/example-showcase-ui` before duplicating them in apps.
- Keep each app linear and scoped: SDK basics, backend stack, browser wallets, keystore management.
- Surface known gaps in the gateway instead of hiding them in docs.
