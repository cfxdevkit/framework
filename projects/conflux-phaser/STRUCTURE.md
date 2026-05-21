# projects/conflux-phaser — Detailed Structure

Smallest project. Plain single-app Vite layout.

```
conflux-phaser/
├── README.md
├── package.json
├── moon.yml
├── .env.example
│
└── apps/
    └── web/
        ├── package.json
        ├── vite.config.ts          plain Vite
        ├── moon.yml
        ├── index.html
        ├── public/
        │   └── assets/             game sprites, audio
        ├── src/
        │   ├── main.tsx            React mount
        │   ├── App.tsx             wallet UI shell
        │   ├── lib/
        │   │   └── chain.ts        framework/wallet-connect
        │   ├── ui/                 React components (HUD, menus, modals)
        │   │   ├── HUD.tsx
        │   │   ├── ConnectButton.tsx
        │   │   └── PauseMenu.tsx
        │   └── game/
        │       ├── index.ts        Phaser game factory
        │       ├── scenes/
        │       │   ├── Boot.ts
        │       │   ├── Preload.ts
        │       │   ├── Main.ts
        │       │   └── GameOver.ts
        │       ├── entities/
        │       ├── plugins/
        │       └── config.ts
        └── styles/
```

### Framework usage

- `@cfxdevkit/wallet-connect` (replaces hand-rolled RainbowKit setup)
- `@cfxdevkit/cdk`

### Migration notes

Lowest risk. Migrate first as a validation of framework wiring. Consider promoting the
final shape to `platform/templates/phaser-game`.
