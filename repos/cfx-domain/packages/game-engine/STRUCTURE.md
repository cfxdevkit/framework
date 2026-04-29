# domains/game-engine — Detailed Structure

Engine-agnostic on-chain game primitives. **No game rules.**

```
game-engine/
├── README.md
├── package.json                    @cfxdevkit/game-engine
├── tsconfig.json
├── vite.config.ts
├── moon.yml
└── src/
    ├── index.ts
    │
    ├── state/                      ── Local game state ──
    │   ├── index.ts
    │   ├── store.ts                Zustand store factory (no React import)
    │   ├── selectors.ts            common selectors
    │   ├── persistence.ts          IndexedDB / localStorage
    │   └── types.ts                GameState, EntityId
    │
    ├── engine/                     ── Game loop / state machine ──
    │   ├── index.ts
    │   ├── machine.ts              XState-style turn/round/phase machine
    │   ├── actions.ts              Action dispatcher
    │   ├── reducer.ts              pure state transitions
    │   └── time.ts                 tick / timing helpers
    │
    ├── entities/                   ── Entity interfaces ──
    │   ├── index.ts
    │   ├── character.ts
    │   ├── inventory.ts
    │   ├── item.ts
    │   └── stats.ts                generic stats container
    │
    ├── chain-bridge/               ── Chain ↔ local-state bridge ──
    │   ├── index.ts
    │   ├── event-listener.ts       framework/core event subscription → store
    │   ├── action-dispatcher.ts    local action → contract write
    │   ├── optimistic.ts           optimistic updates + rollback
    │   └── sync.ts                 reconciliation
    │
    ├── adapters/                   ── Renderer adapters ──
    │   ├── index.ts
    │   ├── react.ts                hooks for React renderers
    │   └── phaser.ts               bridge for Phaser scenes
    │
    └── internal/
        └── id.ts                   id generation
```

### Public exports map

```
".", "./state", "./engine", "./entities", "./chain-bridge",
"./adapters/react", "./adapters/phaser"
```

### Origin

Extracted from `chainbrawler/packages/core`. RPG-specific rules stay in
`projects/chainbrawler/packages/game-rules/`.
