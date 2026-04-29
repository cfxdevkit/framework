# platform/vscode-extension — Detailed Structure

```
vscode-extension/
├── README.md
├── package.json                    name: cfxdevkit-vscode (publisher)
├── tsconfig.json
├── vite.config.ts                  bundles to dist/extension.js
├── moon.yml
├── .vscodeignore
├── icon.png
└── src/
    ├── extension.ts                activate / deactivate
    │
    ├── statusbar/
    │   ├── index.ts
    │   ├── chain.ts                current chain + RPC health
    │   ├── account.ts              active account + balance
    │   └── gas.ts
    │
    ├── views/                      ── Tree views ──
    │   ├── index.ts
    │   ├── deployments.ts
    │   ├── contracts.ts
    │   ├── mcp-tools.ts
    │   └── session-keys.ts
    │
    ├── commands/                   ── Command palette entries ──
    │   ├── index.ts
    │   ├── scaffold.ts             invokes scaffold-cli
    │   ├── compile.ts
    │   ├── deploy.ts
    │   ├── simulate.ts
    │   └── unlock-keystore.ts
    │
    ├── mcp/                        ── MCP client wiring ──
    │   ├── index.ts
    │   ├── client.ts
    │   └── tools.ts
    │
    ├── webview/                    ── Embedded UI panels ──
    │   ├── index.ts
    │   ├── dashboard.ts
    │   └── assets/                 built by Vite (separate sub-build)
    │
    └── internal/
        └── workspace.ts
```

### Notes

- The extension is a **client** of `platform/mcp-server` and `platform/devtools/devkit-server`.
  It contains no chain logic of its own.
- Webview UI is its own Vite sub-build to keep the extension bundle small.
