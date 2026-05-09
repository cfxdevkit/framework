# projects/cas — Detailed Structure

```
cas/
├── README.md
│
├── apps/
│   ├── frontend/                   ── Next.js 16 local user UI ──
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── src/
│   │   │   └── app/
│   │   │       ├── globals.css     Operational dashboard styling
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx        SIWE sign-in, job form, job table
│   │   └── tsconfig.json
│   │
│   ├── backend/                    ── Express API, SQLite local dev ──
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts            bootstrap
│   │       ├── db/
│   │       │   └── sqlite.ts       automation schema + CAS auth nonce table
│   │       ├── routes/
│   │       │   ├── auth.ts         SIWE via @cfxdevkit/wallet-connect/siwe
│   │       │   ├── health.ts
│   │       │   ├── jobs.ts         job creation/list/cancel/history
│   │       │   └── session.ts      bearer session helper
│   │       ├── app.ts              app factory for tests/runtime
│   │       ├── config.ts           env resolution
│   │       └── types.ts
│   │
│   └── worker/                     ── Keeper (migrates last, behind feature flag) ──
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
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── src/
│           ├── index.ts
│           ├── client.ts           fetch client and API response contracts
│           ├── client.test.ts
│           ├── jobs.ts             request/response DTOs and serializers
│           └── jobs.test.ts
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

- `@cfxdevkit/automation` provides SQLite schema, job repository and execution repository.
- `@cfxdevkit/services/auth` provides reusable bearer session-token helpers.
- `@cfxdevkit/wallet-connect/siwe` provides SIWE parsing/verification.
- `@cfxdevkit/wallet-connect` provides the no-ConnectKit frontend wallet layer.
- `@cfxdevkit/cas-shared` provides the frontend/backend API contracts and client.

### Migration risk

**Medium until worker integration begins** — the local UI/backend slice is testable, while worker
execution and production persistence still migrate after frontend/backend contracts stabilize.
