# framework/defi-react — Detailed Structure

```
defi-react/
├── README.md
├── package.json                    @cfxdevkit/defi-react
├── tsconfig.json
├── vite.config.ts
├── moon.yml
└── src/
    ├── index.ts
    │
    ├── token/                      ── Token-aware hooks ──
    │   ├── index.ts
    │   ├── useToken.ts             metadata
    │   ├── useTokenBalance.ts
    │   ├── useTokenAllowance.ts
    │   └── useApprove.ts
    │
    ├── swap/                       ── Swap UX ──
    │   ├── index.ts
    │   ├── useQuote.ts             routes through services/dex
    │   ├── useSwap.ts
    │   └── useSlippage.ts
    │
    ├── liquidity/                  ── LP helpers ──
    │   ├── index.ts
    │   ├── useAddLiquidity.ts
    │   └── useRemoveLiquidity.ts
    │
    └── format/
        ├── index.ts
        └── price.ts
```

### Public exports map

```
".", "./token", "./swap", "./liquidity", "./format"
```

### Dependencies

- Peer: `react`, `@tanstack/react-query`.
- Runtime: `framework/core`, `framework/react`, `framework/services` (DEX).
