# .pi/extensions

This directory contains the legacy single-file extension that re-exports
`registerPiAgentProjectExtension` from pi-agent.

New extensions should be added to the `@cfxdevkit/pi-extensions` npm package
instead:

```
repos/cfx-tools/infra/pi-extensions/
├── package.json          # @cfxdevkit/pi-extensions manifest
└── extensions/
    ├── 00-session-state.ts   # Git guard, checkpoint, persistence
    ├── 01-prompt-customizer.ts  # Context-aware tool guidance
    └── index.ts              # Composes all modules
```

## Legacy

- `repo-agent.ts` — Re-exports `registerPiAgentProjectExtension` from pi-agent.
