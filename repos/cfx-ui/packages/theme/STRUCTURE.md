# @cfxdevkit/theme — Detailed Structure

UI-library agnostic. Outputs JSON + CSS variables + Tailwind preset.

```
theme/
├── README.md
├── package.json                    @cfxdevkit/theme
├── tsconfig.json
├── vite.config.ts
├── moon.yml
└── src/
    ├── index.ts
    │
    ├── tokens/                     ── Design tokens ──
    │   ├── index.ts
    │   ├── color.ts                semantic + raw palette
    │   ├── spacing.ts
    │   ├── radius.ts
    │   ├── typography.ts
    │   ├── shadow.ts
    │   └── motion.ts
    │
    ├── modes/                      ── Light / dark / high-contrast ──
    │   ├── index.ts
    │   ├── light.ts
    │   ├── dark.ts
    │   └── high-contrast.ts
    │
    ├── outputs/                    ── Format adapters ──
    │   ├── index.ts
    │   ├── css-variables.ts        emit :root { --color-… }
    │   ├── tailwind-preset.ts
    │   └── json.ts
    │
    └── internal/
        └── scale.ts                token-scale helpers
```

### Public exports map

```
".", "./tokens", "./modes", "./outputs", "./outputs/css-variables", "./outputs/tailwind-preset"
```

### Dependencies

- None at runtime. Pure data + small format helpers.
