# framework/  — Tier 0: Reusable SDK

The published, semver-stable backbone consumed by every other tier.
All packages here ship to npm under the `@cfxdevkit/*` scope.

## Rules

- Pure libraries. No app code, no infra, no project-specific logic.
- No upward dependencies (cannot import from `platform/`, `domains/`, `projects/`).
- Tree-shakeable; typed entrypoints; LICENSE in every package.
- Browser-safe packages must not import Node-only APIs.

## Packages

| Package | Scope | Source today |
|---------|-------|--------------|
| [core/](core/) | RPC clients, contract I/O, HD wallet, batching, ABIs | `devkit/packages/core` |
| [services/](services/) | AES-256 encryption, encrypted keystore, DEX adapters | `devkit/packages/services` |
| [wallet/](wallet/) | Focused wallet primitives (session keys, batching) | `devkit/packages/wallet` |
| [compiler/](compiler/) | Runtime Solidity compiler + contract templates | `devkit/packages/compiler` |
| [devnode/](devnode/) | Local `@xcfx/node` lifecycle helpers (dev-only) | `devkit/packages/devnode` |
| [contracts/](contracts/) | Generated ABIs, bytecode, mainnet addresses | `devkit/packages/contracts` |
| [protocol/](protocol/) | Raw on-chain artifacts for tooling | `devkit/packages/protocol` |
| [executor/](executor/) | Keeper / automation execution primitives | `devkit/packages/executor` |
| [react/](react/) | Headless React hooks + components | `devkit/packages/react` |
| [wallet-connect/](wallet-connect/) | Wagmi v2 + ConnectKit + SIWE | `devkit/packages/wallet-connect` |
| [defi-react/](defi-react/) | React helpers for DeFi flows | `devkit/packages/defi-react` |
| [theme/](theme/) | Shared UI tokens / theme | `devkit/packages/theme` |
| [testing/](testing/) | Test fixtures, mock chains, contract harness | _new_ |

## Layering inside framework/

```
Layer 1 (UI):        react · wallet-connect · defi-react · theme
                            │
Layer 0 (Chain):     core · services · wallet · compiler · contracts · protocol · executor · devnode · testing
```

Layer 1 may import Layer 0; never the reverse.
