# @cfxdevkit/client — Directory Structure

## Root Files
- `.gitignore` — Git ignore rules  
- `API.md` — API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file: directory layout documentation  
- `moon.yml` — Moon repo configuration  
- `package.json` — Package metadata and dependencies  
- `tsconfig.json` — TypeScript compiler configuration  
- `vite.config.ts` — Vite build configuration  

## `src/`
- `client.ts` — Main client class implementation  
- `http.test.ts` — HTTP client unit tests  
- `http.ts` — HTTP request/response utilities  
- `index.contracts.test.ts` — Contracts namespace tests  
- `index.namespaces.test.ts` — Namespaces module tests  
- `index.network.test.ts` — Network module tests  
- `index.test.ts` — Core module tests  
- `index.ts` — Package entry point (re-exports)  
- `namespaces-runtime.ts` — Runtime namespace resolution logic  
- `namespaces.ts` — Namespace definitions and helpers  
- `test-helpers.ts` — Shared test utilities and mocks  
- `types.ts` — Re-exports of all type definitions  

## `src/types/`
- `bootstrap.ts` — Bootstrap-related types  
- `client.ts` — Client-specific types  
- `common.ts` — Shared/common types  
- `contracts.ts` — Contract interface types  
- `keystore.ts` — Keystore interaction types  
- `network.ts` — Network-related types  
- `node.ts` — Node interaction types  

Directory tree:
```
.gitignore
API.md
README.md
STRUCTURE.md
moon.yml
package.json
src
  client.ts
  http.test.ts
  http.ts
  index.contracts.test.ts
  index.namespaces.test.ts
  index.network.test.ts
  index.test.ts
  index.ts
  namespaces-runtime.ts
  namespaces.ts
  test-helpers.ts
  types
    bootstrap.ts
    client.ts
    common.ts
    contracts.ts
    keystore.ts
    network.ts
    node.ts
  types.ts
tsconfig.json
vite.config.ts
```

<!-- structure-status: enriched -->
<!-- structure-hash: d21d611caf7d16dcb87aedf87f8b12b7dafc4414aee5bbf1208acc49fe6ee660 -->
