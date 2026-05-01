# platform/cli — Detailed Structure

```
cli/
├── README.md
├── STRUCTURE.md
├── API.md
├── package.json                    @cfxdevkit/cli
├── tsconfig.json
├── vite.config.ts                  node CLI build
├── moon.yml
├── dist/                           build output
└── src/
    ├── index.ts                    public exports for the CLI helpers
    ├── args.ts                     argument parsing types + parser
    ├── run.ts                      top-level command dispatcher
    └── commands/
        ├── derive.ts               dual-space account derivation
        ├── generate.ts             mnemonic generation
        └── status.ts               chain status probing
```

### Public exports map

```
"."
```

### Runtime role

- Developer-facing CLI over `@cfxdevkit/core` primitives.
- Designed for terminal use, but its command helpers are also exported for tests
  and programmatic invocation.