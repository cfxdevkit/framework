# projects/chainbrawler — Detailed Structure

```
chainbrawler/
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── moon.yml
├── .env.example
│
├── apps/
│   └── web-ui/                     ── Vite + React + Mantine ──
│       ├── package.json
│       ├── vite.config.ts          plain Vite (replaces previous custom setup)
│       ├── moon.yml
│       ├── index.html
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── routes/
│       │   ├── features/
│       │   │   ├── character/
│       │   │   ├── combat/
│       │   │   ├── inventory/
│       │   │   └── leaderboard/
│       │   ├── components/
│       │   ├── lib/
│       │   │   └── chain.ts        wires framework/wallet-connect
│       │   └── styles/
│       └── public/
│
├── packages/
│   ├── game-rules/                 ── RPG-specific rules ──
│   │   ├── package.json
│   │   ├── moon.yml
│   │   └── src/
│   │       ├── index.ts
│   │       ├── classes/            warrior, mage, rogue…
│   │       ├── combat/             damage formulas, status effects
│   │       ├── progression/        xp, levels
│   │       └── balance.ts          tunables
│   │
│   └── react-bindings/             ── Adapter: game-rules ↔ web-ui ── (kept project-local)
│       ├── package.json
│       ├── moon.yml
│       └── src/
│           ├── index.ts
│           ├── hooks/
│           └── providers/
│
├── contracts/
│   ├── README.md
│   ├── hardhat.config.ts
│   ├── moon.yml
│   ├── contracts/
│   │   ├── ChainBrawler.sol
│   │   ├── Items.sol
│   │   └── interfaces/
│   ├── test/
│   ├── scripts/
│   │   └── deploy.ts
│   ├── deployments/
│   └── AUDITS.md
│
└── e2e/
    ├── playwright.config.ts
    └── tests/
        └── play-through.spec.ts
```

### Framework / domain usage

- `@cfxdevkit/cdk`, `@cfxdevkit/react`, `@cfxdevkit/wallet-connect`
- `@cfxdevkit/game-engine` (state machine, chain-bridge, react adapter)

### Migration notes

- Engine-shaped pieces of `chainbrawler/packages/core` move to `domains/game-engine`.
- The dev orchestrator in today's `packages/utils` is evaluated for promotion to `platform/devtools/devkit-server`.
