# framework/protocol — Detailed Structure

Lower-level than `framework/contracts`: raw artifacts for tooling consumers
(indexers, explorers, MCP). No opinionated TS surface.

```
protocol/
├── README.md
├── package.json                    @cfxdevkit/protocol
├── tsconfig.json
├── vite.config.ts
├── moon.yml
└── src/
    ├── index.ts
    │
    ├── selectors/                  4-byte function selectors → human signature
    │   ├── index.ts
    │   ├── erc20.json
    │   ├── erc721.json
    │   └── conflux-internal.json
    │
    ├── events/                     event topic0 → schema
    │   ├── index.ts
    │   ├── erc20.json
    │   └── swappi.json
    │
    ├── schemas/                    JSON schemas for on-chain payloads
    │   ├── index.ts
    │   └── ...
    │
    └── networks/                   network metadata (RPC endpoints, explorers, faucets)
        ├── index.ts
        ├── espace.json
        └── core-space.json
```

### Public exports map

```
".", "./selectors", "./events", "./schemas", "./networks"
```
