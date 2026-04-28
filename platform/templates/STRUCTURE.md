# platform/templates — Detailed Structure

Each template is **self-contained** and runnable after scaffolding (no monorepo coupling).

```
templates/
├── README.md
│
├── minimal-dapp/
│   ├── template.json               metadata: name, description, prompts
│   ├── README.md
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── lib/
│   │       └── chain.ts            uses @cfxdevkit/core + wallet-connect
│   └── .env.example
│
├── project-example/                full-feature reference dapp
│   ├── template.json
│   ├── README.md
│   ├── apps/web/
│   ├── apps/api/
│   ├── packages/shared/
│   └── moon.yml
│
├── wallet-probe/                   diagnostics tool
│   ├── template.json
│   ├── README.md
│   └── src/
│
├── nextjs-app/                     Next.js 15 + framework
│   ├── template.json
│   ├── README.md
│   └── ...
│
├── phaser-game/                    extracted from conflux-phaser
│   ├── template.json
│   ├── README.md
│   ├── index.html
│   └── src/
│       ├── main.tsx                React + wallet-connect
│       └── game/                   Phaser scenes
│
├── keeper/                         executor + automation strategy starter
│   ├── template.json
│   ├── README.md
│   └── src/
│
└── _shared/                        ── shared template fragments ──
    ├── biome.json
    ├── tsconfig.base.json
    ├── .gitignore
    └── README.md.tmpl
```

### Template contract

- `template.json` declares: `name`, `description`, `tags`, `prompts[]`, `postSteps[]`.
- Files use Handlebars `{{var}}` substitution for prompt answers.
- Files in `_shared/` are merged into every scaffolded project.
