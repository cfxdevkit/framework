# @cfxdevkit/testing — Detailed Structure

Dev-dependency only. Used by every package and project.

```
testing/
├── README.md
├── package.json                    @cfxdevkit/testing
├── tsconfig.json
├── vite.config.ts
├── moon.yml
└── src/
    ├── index.ts
    │
    ├── chain/                      ── Mock & in-memory chains ──
    │   ├── index.ts
    │   ├── mock-client.ts          Viem-shaped mock
    │   ├── anvil-like.ts           thin wrapper for ephemeral local node
    │   └── fixtures.ts
    │
    ├── contract/                   ── Contract test harness ──
    │   ├── index.ts
    │   ├── deploy-helper.ts
    │   ├── snapshot-revert.ts
    │   └── time-travel.ts
    │
    ├── fixtures/                   ── Reusable data ──
    │   ├── index.ts
    │   ├── accounts.ts             well-known dev addresses
    │   ├── tokens.ts
    │   └── txs.ts
    │
    ├── matchers/                   ── Vitest matchers ──
    │   ├── index.ts
    │   ├── toEmitEvent.ts
    │   ├── toRevertWith.ts
    │   └── toEqualAddress.ts
    │
    └── msw/                        ── MSW handlers for RPC mocking ──
        ├── index.ts
        └── rpc-handlers.ts
```

### Public exports map

```
".", "./chain", "./contract", "./fixtures", "./matchers", "./msw"
```

### Dependencies

- Peer: `vitest`, `msw`.
- Runtime: `framework/core`, `framework/devnode` (optional).
