# platform/scaffold-cli — Detailed Structure

```
scaffold-cli/
├── README.md
├── package.json                    @cfxdevkit/create
├── tsconfig.json
├── vite.config.ts                  node CLI build
├── moon.yml
├── bin/
│   └── create-cfx
└── src/
    ├── index.ts                    CLI entry
    │
    ├── commands/
    │   ├── index.ts
    │   ├── new.ts                  `create-cfx new <template> <dir>`
    │   ├── add.ts                  `create-cfx add <feature>` (e.g. wallet, mcp)
    │   └── list.ts                 `create-cfx list`
    │
    ├── templates/                  ── Template loader ──
    │   ├── index.ts
    │   ├── registry.ts             discovers ../../templates/* + remote
    │   ├── render.ts               EJS / Handlebars rendering
    │   └── variables.ts            prompt schema → answers
    │
    ├── post/                       ── Post-scaffold actions ──
    │   ├── index.ts
    │   ├── pnpm-install.ts
    │   ├── git-init.ts
    │   ├── env-setup.ts
    │   └── moon-init.ts
    │
    ├── ui/                         ── Terminal UI ──
    │   ├── index.ts
    │   ├── prompts.ts              clack-prompts wrappers
    │   └── spinner.ts
    │
    └── internal/
        └── fs.ts                   safe fs helpers
```

### Public exports map

```
"."  (CLI only; no library API)
```
