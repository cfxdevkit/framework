# projects/cas — Detailed Structure

```
cas/
├── README.md
├── package.json
├── pnpm-workspace.yaml             scopes the project's internal packages
├── moon.yml
├── .env.example
│
├── apps/
│   ├── frontend/                   ── Next.js 15 user UI ──
│   │   ├── package.json
│   │   ├── next.config.ts          (kept on Next; CAS already deployed there)
│   │   ├── moon.yml
│   │   ├── src/
│   │   │   ├── app/                App router
│   │   │   ├── features/
│   │   │   │   ├── orders/
│   │   │   │   ├── dashboard/
│   │   │   │   └── auth/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── styles/
│   │   └── public/
│   │
│   ├── backend/                    ── Express API ──
│   │   ├── package.json
│   │   ├── vite.config.ts          node target, SSR build
│   │   ├── moon.yml
│   │   └── src/
│   │       ├── index.ts            bootstrap
│   │       ├── routes/
│   │       │   ├── orders.ts
│   │       │   ├── auth.ts         SIWE via @cfxdevkit/wallet-connect/siwe
│   │       │   ├── history.ts
│   │       │   └── health.ts
│   │       ├── db/
│   │       │   ├── client.ts       Postgres client
│   │       │   ├── migrations/
│   │       │   └── repositories/
│   │       ├── services/
│   │       │   └── order-service.ts
│   │       └── middleware/
│   │           ├── auth.ts
│   │           └── rate-limit.ts
│   │
│   └── worker/                     ── Keeper ──
│       ├── package.json
│       ├── vite.config.ts          node target
│       ├── moon.yml
│       └── src/
│           ├── index.ts            bootstrap
│           ├── runner.ts           wraps framework/executor
│           ├── strategies/         binds domains/automation strategies to CAS persistence
│           │   └── index.ts
│           ├── signers/
│           │   └── session-key.ts  uses framework/wallet/session-key
│           └── observability/
│               └── metrics.ts
│
├── packages/
│   └── shared/                     ── CAS-only types/utils ──
│       ├── package.json
│       ├── moon.yml
│       └── src/
│           ├── index.ts
│           ├── api-types.ts        OpenAPI-derived types
│           └── domain/
│               ├── order.ts        CAS-specific order shape
│               └── execution.ts
│
├── contracts/                      ── Solidity sources + deployments ──
│   ├── README.md
│   ├── hardhat.config.ts
│   ├── moon.yml
│   ├── contracts/
│   │   ├── OrderVault.sol
│   │   ├── Executor.sol
│   │   └── interfaces/
│   ├── test/
│   ├── scripts/
│   │   └── deploy.ts
│   ├── deployments/
│   │   ├── espace-mainnet.json
│   │   └── espace-testnet.json
│   └── AUDITS.md                   audit history
│
└── e2e/
    ├── README.md
    ├── playwright.config.ts
    └── tests/
        ├── place-order.spec.ts
        └── execution.spec.ts
```

### Framework usage

- `@cfxdevkit/core`, `@cfxdevkit/wallet`, `@cfxdevkit/wallet-connect`,
  `@cfxdevkit/services` (KMS keystore in production), `@cfxdevkit/executor`,
  `@cfxdevkit/automation` (domains).

### Migration risk

**High** — live mainnet system. Worker migrates last, behind a feature flag.
