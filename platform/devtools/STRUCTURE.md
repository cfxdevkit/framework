# platform/devtools — Detailed Structure

Internal-only tools. Not published as user CLIs.

```
devtools/
├── README.md
│
├── contracts/                      ── Hardhat workspace for framework-owned contracts ──
│   ├── README.md
│   ├── package.json
│   ├── hardhat.config.ts
│   ├── moon.yml
│   ├── contracts/
│   │   ├── multicall3/
│   │   ├── session-key-validator/
│   │   └── examples/
│   ├── test/
│   ├── scripts/
│   │   ├── deploy.ts
│   │   └── extract-artifacts.ts    feeds framework/contracts codegen
│   └── deployments/                JSON deploy records by chain
│
├── devkit-server/                  ── Local Express server (replaces devkit/devtools/devkit) ──
│   ├── README.md
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── moon.yml
│   └── src/
│       ├── index.ts                bootstrap
│       ├── routes/
│       │   ├── nodes.ts            start/stop devnode
│       │   ├── compile.ts
│       │   ├── deploy.ts
│       │   └── keystore.ts         interactive keystore unlock
│       ├── ws/
│       │   └── events.ts           live updates to UI
│       └── internal/
│
├── devkit-ui/                      ── Embedded UI shipped with devkit-server ──
│   ├── README.md
│   ├── package.json
│   ├── vite.config.ts              builds to ../devkit-server/dist/ui
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── Nodes.tsx
│       │   ├── Contracts.tsx
│       │   └── Keystore.tsx
│       └── lib/
│
└── cfx-keystore/                   ── Standalone keystore TUI ──
    ├── README.md
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts              node CLI build
    ├── moon.yml
    ├── bin/
    │   └── cfx-keystore
    └── src/
        ├── index.ts
        ├── commands/
        │   ├── init.ts             create file keystore
        │   ├── add.ts
        │   ├── list.ts
        │   ├── unlock.ts           passphrase prompt → in-memory unlock
        │   ├── export.ts           SOPS+age export
        │   └── import.ts
        └── ui/                     ink TUI components
```
