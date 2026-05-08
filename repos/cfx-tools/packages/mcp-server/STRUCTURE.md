# platform/mcp-server — Detailed Structure

```
mcp-server/
├── README.md
├── API.md
├── STRUCTURE.md
├── package.json                    @cfxdevkit/mcp-server
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── moon.yml
└── src/
    ├── index.ts                    public barrel
    ├── index.test.ts               registry and ledger tests
    ├── operations.ts               in-memory operation ledger
    └── tools/
        ├── accounts.ts             account tool definitions
        ├── blockchain.ts           blockchain read/write definitions
        ├── compiler.ts             compiler tool definitions
        ├── keystore.ts             keystore tool definitions
        ├── node.ts                 dev node tool definitions
        ├── registry.ts             combined registry helpers
        ├── types.ts                registry types
        └── wallet.ts               wallet utility definitions
```

### Public exports map

```
"."
```

### Security

- Tool definitions include `mutability` and `requiresConfirmation`.
- Every `write` and `admin` tool must remain confirmation-gated when runtime handlers land.
- Raw private keys are not accepted by the tool surface; writes should go through managed signer abstractions.
