# @cfxdevkit/wallet-connect — Detailed Structure

Opinionated wallet-connection bundle for web apps using @cfxdevkit/wallet-connect.

```
wallet-connect/
├── README.md
├── package.json                    @cfxdevkit/wallet-connect
├── tsconfig.json
├── vite.config.ts
├── moon.yml
└── src/
    ├── index.ts
    │
    ├── config/                     ── Wagmi config builder ──
    │   ├── index.ts
    │   ├── createConfig.ts         pre-wires Conflux chains + connectors
    │   └── chains.ts               re-exports framework/core chains as wagmi chains
    │
    ├── connectors/                 ── Connector wrappers ──
    │   ├── index.ts
    │   ├── injected.ts
    │   ├── wallet-connect.ts
    │   ├── coinbase.ts
    │   └── fluent.ts               Conflux Fluent wallet
    │
    ├── connectkit/                 ── ConnectKit wiring ──
    │   ├── index.ts
    │   ├── ConnectKitProvider.tsx
    │   └── theme.ts                maps framework/theme → ConnectKit
    │
    ├── siwe/                       ── Sign-In With Ethereum ──
    │   ├── index.ts
    │   ├── createMessage.ts
    │   ├── verify.ts               server-side verification helper
    │   └── nonce.ts
    │
    ├── hooks/                      ── Convenience hooks ──
    │   ├── index.ts
    │   ├── useConnectFlow.ts
    │   └── useSiweSession.ts
    │
    └── internal/
        └── storage.ts              SSR-safe storage adapter
```

### Public exports map

```
".", "./config", "./connectors", "./connectkit", "./siwe", "./hooks"
```

### Dependencies

- Peer: `react`, `wagmi`, `viem`, `connectkit`.
- Runtime: `framework/core`, optional `framework/react`, optional `framework/theme`.
