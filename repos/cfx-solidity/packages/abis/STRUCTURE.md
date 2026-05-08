# @cfxdevkit/abis — Detailed Structure

```
abis/
├── README.md
├── STRUCTURE.md
├── API.md
├── package.json                    @cfxdevkit/abis
├── tsconfig.json
├── vite.config.ts
├── moon.yml
└── src/
    ├── index.ts                    stable ABI constants and compatibility aliases
    └── index.test.ts               ABI shape and signature assertions
```

### Public exports map

```
"."
```

### Dependencies

- Runtime: `viem` only.
- Internal workspace deps: none.
- Safe to consume from any workspace tier because it introduces no cfxdevkit cycles.