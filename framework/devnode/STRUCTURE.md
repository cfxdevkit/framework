# framework/devnode — Detailed Structure

**Dev-only.** Never bundled into a runtime application.

```
devnode/
├── README.md
├── package.json                    @cfxdevkit/devnode
├── tsconfig.json
├── vite.config.ts                  node-only build
├── moon.yml
└── src/
    ├── index.ts
    │
    ├── lifecycle/                  ── Node process lifecycle ──
    │   ├── index.ts
    │   ├── start.ts                start({ port, dataDir, genesis })
    │   ├── stop.ts
    │   ├── health.ts               readiness probe
    │   └── ports.ts                free-port allocation
    │
    ├── genesis/                    ── Deterministic genesis ──
    │   ├── index.ts
    │   ├── default.ts              pre-funded test accounts
    │   ├── funded-accounts.ts      24-word mnemonic shipped for tests only
    │   └── chain-id.ts
    │
    ├── snapshot/                   ── Snapshot / restore for test isolation ──
    │   ├── index.ts
    │   ├── take.ts
    │   ├── restore.ts
    │   └── store.ts
    │
    ├── docker/                     ── Optional Docker driver ──
    │   ├── index.ts
    │   ├── compose.ts
    │   └── image.ts
    │
    └── internal/
        └── exec.ts                 child_process helpers
```

### Public exports map

```
".", "./lifecycle", "./genesis", "./snapshot", "./docker"
```

### Dependencies

- Runtime peer: `@xcfx/node`.
- Optional peer: `dockerode` for the Docker driver.
