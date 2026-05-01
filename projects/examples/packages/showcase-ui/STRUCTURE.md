# `projects/examples/packages/showcase-ui` — Detailed Structure

```
showcase-ui/
├── README.md
├── STRUCTURE.md
├── API.md
├── package.json                    @cfxdevkit/example-showcase-ui
├── tsconfig.json
├── vite.config.ts                  library build for example-shared UI
├── vitest.config.ts
├── moon.yml
├── dist/                           build output
└── src/
    ├── index.ts                    package export barrel
    ├── components/                 shared presentational components
    └── lib/                        example-specific wallet and logging helpers
```

### Runtime role

- Shared UI layer for `showcase-browser` and `showcase-stack`.
- Not a general-purpose framework package; this stays project-scoped under `projects/examples`.