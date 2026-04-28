# framework/react — Detailed Structure

Headless. No styling, no UI library.

```
react/
├── README.md
├── package.json                    @cfxdevkit/react
├── tsconfig.json
├── vite.config.ts                  lib mode, react/jsx-runtime external
├── moon.yml
└── src/
    ├── index.ts
    │
    ├── provider/                   ── Top-level providers ──
    │   ├── index.ts
    │   ├── ChainProvider.tsx       supplies client + chain config via context
    │   └── QueryProvider.tsx       wraps react-query
    │
    ├── hooks/                      ── Data hooks ──
    │   ├── index.ts
    │   ├── useChainClient.ts
    │   ├── useBlockNumber.ts
    │   ├── useBalance.ts
    │   ├── useContractRead.ts
    │   ├── useContractWrite.ts
    │   ├── useSimulate.ts
    │   ├── useWatchEvent.ts
    │   └── useTransactionReceipt.ts
    │
    ├── components/                 ── Headless components (render-prop / asChild) ──
    │   ├── index.ts
    │   ├── Address.tsx             format + copy + explorer link slot
    │   ├── Amount.tsx              token-aware formatter
    │   └── TxStatus.tsx
    │
    ├── utils/
    │   ├── index.ts
    │   ├── ssr.ts                  SSR-safe guards
    │   └── format.ts
    │
    └── internal/
        └── context.ts
```

### Public exports map

```
".", "./provider", "./hooks", "./components", "./utils"
```

### Dependencies

- Peer: `react ^19`, `@tanstack/react-query ^5`.
- Runtime: `framework/core`.
