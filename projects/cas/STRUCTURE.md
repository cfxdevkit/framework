# projects/cas — Detailed Structure

```
cas/
├── README.md
├── STRUCTURE.md
├── CHANGELOG.md
├── AUDITS.md
├── .gitignore
│
├── apps/
│   ├── backend/                    ── Express API + embedded keeper ──
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env.example            template — copy to .env before running
│   │   └── src/
│   │       ├── index.ts            bootstrap: load config, start HTTP server, start keeper
│   │       ├── app.ts              Express app factory used by both runtime and tests
│   │       ├── config.ts           resolveCasBackendConfig() — reads all env vars
│   │       ├── types.ts            CasBackendState interface
│   │       ├── worker.ts           embedded keeper factory (createKeeperWorker)
│   │       ├── db/
│   │       │   └── sqlite.ts       SQLite runtime: automation schema + nonce table
│   │       ├── routes/
│   │       │   ├── admin.ts        GET|POST /admin/status|pause|resume|jobs|safety
│   │       │   ├── auth.ts         GET /auth/nonce, POST /auth/verify, GET /auth/me
│   │       │   ├── health.ts       GET /health
│   │       │   ├── job-validators.ts  Zod validators for job creation payloads
│   │       │   ├── jobs.ts         GET|POST /jobs, GET|POST|DELETE /jobs/:id, GET /jobs/:id/executions
│   │       │   ├── pool-fallback.ts   static pool list used when price source is unavailable
│   │       │   ├── pools.ts        GET /pools, POST /pools/refresh
│   │       │   ├── session.ts      bearer token extraction helper
│   │       │   ├── sse.ts          GET /sse/jobs — Server-Sent Events for job updates
│   │       │   └── system.ts       GET /system/status
│   │       ├── sse/
│   │       │   └── events.ts       SSE connection management and event broadcast helpers
│   │       ├── app.test-helpers.ts shared test utilities (accounts, signIn, app/state factories)
│   │       ├── app.auth.test.ts    auth route tests
│   │       ├── app.jobs.test.ts    job CRUD route tests
│   │       ├── app.admin.test.ts   admin route tests
│   │       └── app.pools.test.ts   pools and system status tests
│   │
│   └── frontend/                   ── Next.js 16 dashboard ──
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.ts
│       ├── .env.local.example      template — copy to .env.local before running
│       └── src/
│           ├── app/
│           │   ├── layout.tsx          root layout — NavBar + Providers + main wrapper
│           │   ├── page.tsx            home page — full state machine (not connected → wrong network → auto-sign → authenticated)
│           │   ├── globals.css         Tailwind v4 + @theme conflux color scale
│           │   ├── auth-context.tsx    SIWE session state, CasApiClient, auto-sign on connect
│           │   ├── pools-context.tsx   token and pool list with balances
│           │   ├── providers.tsx       top-level provider tree
│           │   ├── api/
│           │   │   └── [...path]/
│           │   │       └── route.ts    Next.js API proxy — forwards requests to the backend
│           │   ├── create/
│           │   │   └── page.tsx        redirect('/')
│           │   ├── dashboard/
│           │   │   └── page.tsx        redirect('/')
│           │   ├── safety/
│           │   │   └── page.tsx        admin safety config panel
│           │   └── status/
│           │       └── page.tsx        system and keeper status panel
│           ├── components/
│           │   ├── shared/
│           │   │   ├── NavBar.tsx             sticky top nav with logo + admin links + WalletConnect
│           │   │   └── WalletConnect.tsx      connect/switch-network/sign-in/disconnect chip
│           │   ├── Dashboard/
│           │   │   └── Dashboard.tsx          jobs list with SSE real-time updates
│           │   ├── StrategyBuilder/
│           │   │   └── WcfxWrapModal.tsx      CFX ↔ wCFX wrap/unwrap modal
│           │   ├── ApprovalWidget.tsx         ERC-20 allowance manager
│           │   ├── JobForm.tsx                legacy job creation form
│           │   ├── JobsTable.tsx              job list with token symbols and logos
│           │   ├── StrategyBuilder.tsx        multi-step strategy builder (limit/DCA)
│           │   ├── StrategyBuilderParts.tsx   strategy builder sub-components
│           │   ├── SystemAdminPanel.tsx       admin status and safety panel
│           │   └── ui.tsx                     shared UI primitives
│           ├── hooks/
│           │   ├── use-strategy-builder.ts    strategy builder form state
│           │   ├── useIsAdmin.ts              checks NEXT_PUBLIC_ADMIN_ADDRESSES whitelist
│           │   └── useNetworkSwitch.ts        wrong-network detection and switch handler
│           └── lib/
│               ├── deployments.ts    default contract addresses from framework packages
│               ├── ethereum.ts       chain config, ESPACE_CHAINS, readTargetEspaceChain()
│               ├── strategy.ts       StrategyDraft types, readContracts()
│               ├── strategy-chain.ts on-chain job creation: wrap → approve → createLimitOrder/createDCAJob
│               └── strategy-wrap.ts  native CFX → WCFX wrap helper
│
└── packages/
    └── shared/                     ── CAS-only types and HTTP client ──
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts
            ├── admin.ts            admin status and safety config types
            ├── client.ts           CasApiClient — typed fetch wrappers for all API routes
            ├── contracts.ts        on-chain types used by frontend (JobCreated event, etc.)
            ├── jobs.ts             job request/response DTOs and serializers
            ├── pools.ts            pool and token list types
            ├── sse.ts              SSE event types
            ├── system.ts           system status response types
            ├── client.test.ts
            └── jobs.test.ts
```

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
