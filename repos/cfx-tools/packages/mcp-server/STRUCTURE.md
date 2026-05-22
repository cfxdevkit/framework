# @cfxdevkit/mcp-server Structure

## Root
- `.gitignore` — Git ignore rules  
- `API.md` — Public API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file  
- `moon.yml` — Moon repo configuration  
- `package.json` — Package metadata and dependencies  
- `tsconfig.json` — TypeScript compiler options  
- `vite.config.ts` — Vite build config (for dev tools)  
- `vitest.config.ts` — Vitest test config  

## `src/`
- `bin/server.ts` — CLI entry point  
- `context/loader.ts` — Context loading logic  
- `context/types.ts` — Context type definitions  
- `control-plane.ts` — Control plane orchestration  
- `handlers/accounts.ts` — Account management handlers  
- `handlers/blockchain.ts` — Blockchain interaction handlers  
- `handlers/compiler.ts` — Contract compilation handlers  
- `handlers/keystore.ts` — Keystore management handlers  
- `handlers/node.ts` — Node management handlers  
- `handlers/scaffold.ts` — Project scaffolding handlers  
- `handlers/wallet.ts` — Wallet management handlers  
- `index.test.ts` — Unit tests  
- `index.ts` — Main package entry point  
- `operations.ts` — Core operation logic  
- `resources/chain.ts` — Chain resource definitions  
- `resources/contracts.ts` — Contract resource definitions  
- `resources/docs/overview.md` — Documentation overview  
- `resources/docs/packages.md` — Package documentation  
- `resources/docs/templates.md` — Template documentation  
- `resources/docs.ts` — Docs resource loader  
- `resources/project.ts` — Project resource definitions  
- `resources/registry.ts` — Registry resource definitions  
- `server.ts` — MCP server implementation  
- `tools/accounts.ts` — Account utility functions  
- `tools/blockchain.ts` — Blockchain utility functions  
- `tools/compiler.ts` — Compiler utility functions  
- `tools/keystore.ts` — Keystore utility functions  
- `tools/node.ts` — Node utility functions  
- `tools/registry.ts` — Registry utility functions  
- `tools/scaffold.ts` — Scaffolding utility functions  
- `tools/types.ts` — Shared tool type definitions  
- `tools/wallet.ts` — Wallet utility functions  

Directory tree:
```
.gitignore
API.md
README.md
STRUCTURE.md
moon.yml
package.json
src
  bin
    server.ts
  context
    loader.ts
    types.ts
  control-plane.ts
  handlers
    accounts.ts
    blockchain.ts
    compiler.ts
    keystore.ts
    node.ts
    scaffold.ts
    wallet.ts
  index.test.ts
  index.ts
  operations.ts
  resources
    chain.ts
    contracts.ts
    docs
      overview.md
      packages.md
      templates.md
    docs.ts
    project.ts
    registry.ts
  server.ts
  tools
    accounts.ts
    blockchain.ts
    compiler.ts
    keystore.ts
    node.ts
    registry.ts
    scaffold.ts
    types.ts
    wallet.ts
tsconfig.json
vite.config.ts
vitest.config.ts
```

<!-- structure-status: enriched -->
<!-- structure-hash: 30787c1a951d18c77acc88e537f24d4d62496976ef7fc99659e1d40bc56ad4e9 -->
