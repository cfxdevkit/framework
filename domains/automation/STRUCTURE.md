# domains/automation — Detailed Structure

Strategy library executable by `framework/executor`.

```
automation/
├── README.md
├── package.json                    @cfxdevkit/automation
├── tsconfig.json
├── vite.config.ts
├── moon.yml
└── src/
    ├── index.ts
    │
    ├── strategy/                   ── Strategy interface ──
    │   ├── index.ts
    │   ├── types.ts                Strategy, EvalContext, BuildContext, VerifyContext
    │   ├── base.ts                 abstract Strategy
    │   └── registry.ts
    │
    ├── strategies/                 ── Built-in strategies ──
    │   ├── index.ts
    │   ├── limit-order/
    │   │   ├── index.ts
    │   │   ├── strategy.ts
    │   │   ├── schema.ts           Zod schema of strategy params
    │   │   └── README.md           UX/edge cases
    │   ├── dca/
    │   │   ├── index.ts
    │   │   ├── strategy.ts
    │   │   └── schema.ts
    │   ├── stop-loss/
    │   ├── trailing-stop/
    │   ├── scheduled-tx/
    │   └── conditional/            generic predicate-based
    │
    ├── conditions/                 ── Reusable predicates ──
    │   ├── index.ts
    │   ├── price.ts                price-feed condition (oracle adapter)
    │   ├── time.ts
    │   ├── balance.ts
    │   └── event.ts                on-chain event condition
    │
    ├── persistence/                ── Strategy storage schema ──
    │   ├── index.ts
    │   ├── repository.ts           Repository interface
    │   ├── postgres.ts
    │   └── memory.ts
    │
    ├── backtest/                   ── Backtesting harness ──
    │   ├── index.ts
    │   ├── runner.ts
    │   └── data-source.ts
    │
    └── internal/
        └── price-source.ts         oracle abstraction
```

### Public exports map

```
".", "./strategy", "./strategies", "./strategies/limit-order", "./strategies/dca", …,
"./conditions", "./persistence", "./persistence/postgres", "./backtest"
```

### Origin

Extracted from `cas/conflux-cas/worker` and `cas/conflux-sdk` automation types.
CAS-specific UI/order-builder stays in `projects/cas/`.
