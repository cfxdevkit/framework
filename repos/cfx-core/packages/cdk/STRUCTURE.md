# framework/core — Detailed Structure

Standard layout per [docs/architecture/package-layout.md](../../docs/architecture/package-layout.md). This file documents only the package-specific src tree.

```
core/
├── README.md
├── package.json                    @cfxdevkit/cdk
├── tsconfig.json
├── vite.config.ts                  lib mode, multi-entry
├── moon.yml
└── src/
    ├── index.ts                    public re-exports
    │
    ├── chains/                     Chain definitions & registry
    │   ├── index.ts
    │   ├── espace.ts               eSpace mainnet/testnet/dev configs
    │   ├── core-space.ts           Core Space mainnet/testnet/dev
    │   ├── registry.ts             chain lookup by id/name
    │   └── types.ts                ChainConfig, RpcEndpoint
    │
    ├── client/                     RPC client (Viem-based)
    │   ├── index.ts
    │   ├── create-client.ts        createClient(chain, transport)
    │   ├── transport.ts            http/ws/fallback transports
    │   ├── public-actions.ts       extended public actions for Conflux
    │   └── types.ts
    │
    ├── wallet/                     Wallet primitives (HD, raw, in-memory)
    │   ├── index.ts
    │   ├── hd.ts                   BIP32/44 derivation
    │   ├── account.ts              Account abstraction
    │   ├── signer.ts               Signer interface
    │   └── types.ts
    │
    ├── contract/                   Typed contract I/O
    │   ├── index.ts
    │   ├── read.ts                 readContract helpers
    │   ├── write.ts                writeContract helpers
    │   ├── simulate.ts             simulateContract
    │   ├── deploy.ts               deployContract
    │   └── events.ts               typed event parsing
    │
    ├── batch/                      Multicall / batched RPC
    │   ├── index.ts
    │   ├── multicall.ts
    │   ├── multisend.ts
    │   └── batcher.ts              request coalescing
    │
    ├── abi/                        Standard ABIs
    │   ├── index.ts
    │   ├── erc20.ts
    │   ├── erc721.ts
    │   ├── erc1155.ts
    │   └── multicall3.ts
    │
    ├── address/                    Address utilities
    │   ├── index.ts
    │   ├── checksum.ts
    │   ├── core-to-espace.ts       Conflux address-format bridge
    │   └── validate.ts
    │
    ├── units/                      Token unit math (no floats)
    │   ├── index.ts
    │   ├── format.ts
    │   ├── parse.ts
    │   └── precision.ts
    │
    ├── errors/                     Typed error hierarchy
    │   ├── index.ts
    │   ├── base.ts                 CfxError root
    │   ├── rpc.ts                  RpcError, RateLimitError
    │   └── contract.ts             ContractRevertError
    │
    └── internal/                   Private helpers (not exported)
        ├── hex.ts
        └── retry.ts
```

### Public exports map

```
"./chains", "./client", "./wallet", "./contract", "./batch",
"./abi", "./address", "./units", "./errors"
```

### Dependencies

- Runtime: `viem`, `@noble/hashes`, `@noble/curves`
- Dev: `vitest`, `vite`, `vite-plugin-dts`, `framework/testing` (workspace)

### Boundary

- MUST NOT import from any other `framework/*` package.
- MUST be browser-safe (no `node:*` imports).
