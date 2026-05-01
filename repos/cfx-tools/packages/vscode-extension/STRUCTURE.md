# platform/vscode-extension — Detailed Structure

```
vscode-extension/
├── README.md
├── STRUCTURE.md
├── API.md
├── package.json                    @cfxdevkit/vscode-extension
├── tsconfig.json
├── moon.yml
├── dist/                           compiled extension entry
└── src/
    ├── extension.ts                activate / deactivate + commands
    └── views.ts                    tree providers for network, node, accounts, contracts
```

### Notes

- The current implementation is intentionally Conflux-only.
- Node, wallet, compiler, and deploy logic come from the framework packages in this repository.
- Project/stack automation and DEX tooling are intentionally left out of this package.
