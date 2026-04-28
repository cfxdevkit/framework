# platform/mcp-server — Detailed Structure

```
mcp-server/
├── README.md
├── package.json                    @cfxdevkit/mcp-server
├── tsconfig.json
├── vite.config.ts                  node target
├── moon.yml
├── bin/
│   └── cfx-mcp                     CLI entry (registered in package.json bin)
└── src/
    ├── index.ts                    server bootstrap
    │
    ├── server/                     ── MCP transport ──
    │   ├── index.ts
    │   ├── stdio.ts
    │   ├── sse.ts
    │   └── ws.ts
    │
    ├── tools/                      ── One file per tool. Each declares allowlist + schema. ──
    │   ├── index.ts                tool registry
    │   ├── chain/
    │   │   ├── get-block.ts
    │   │   ├── get-balance.ts
    │   │   └── call.ts
    │   ├── contract/
    │   │   ├── read.ts
    │   │   ├── simulate.ts
    │   │   ├── deploy.ts           write — requires confirmation
    │   │   └── verify.ts
    │   ├── wallet/
    │   │   ├── list-accounts.ts
    │   │   ├── issue-session-key.ts
    │   │   └── revoke-session-key.ts
    │   └── dev/
    │       ├── start-devnode.ts
    │       ├── compile.ts
    │       └── scaffold.ts
    │
    ├── policy/                     ── Security policy enforcement ──
    │   ├── index.ts
    │   ├── allowlist.ts            tools enabled/disabled per-deployment
    │   ├── confirm.ts              user-confirmation prompts for writes
    │   └── audit.ts                per-tool audit log
    │
    ├── context/                    ── Server-side context ──
    │   ├── index.ts
    │   ├── client.ts               framework/core client per session
    │   └── signer.ts               session-key only (never raw key)
    │
    └── internal/
        └── schema.ts               JSON-schema helpers for tool args
```

### Public exports map

```
".", "./tools", "./policy"
```

### Security

- Default tool allowlist excludes every write tool.
- Any write tool MUST go through `policy/confirm.ts`.
- Signer is **always** a session key issued by `wallet/session-key`. Raw private keys are rejected at startup.
