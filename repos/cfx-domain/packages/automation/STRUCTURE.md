# @cfxdevkit/automation — Directory Structure

## Root Files
- `.gitignore` — Git ignore rules  
- `API.md` — Public API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file  
- `moon.yml` — MoonScript build configuration  
- `package.json` — Package metadata and dependencies  
- `tsconfig.json` — TypeScript compiler options  
- `vite.config.ts` — Vite bundler config (for dev)  
- `vitest.config.ts` — Vitest test runner config  

## `src/`
- `conditions/` — Condition evaluation modules (price/time triggers)  
- `db/` — SQLite database layer (repositories, schema, serialization)  
- `index.ts` — Main entry point  
- `keeper/` — On-chain keeper client and ABI definitions  
- `priceSources/` — External price oracle integrations (GeckoTerminal, Swappi)  
- `repository/` — In-memory repository implementation  
- `strategies/` — Trading strategy implementations (DCA, TWAP, limit orders, etc.)  
- `swap/` — Swap execution logic (calldata, executor)  
- `retryQueue.ts` — Retry queue for failed operations  
- `safety.ts` — Safety checks and guards  
- `testHelpers.ts` — Shared test utilities  
- `types.ts` — Shared TypeScript types  

## `dist/`
- (generated) — Compiled output (ESM/CJS) and type declarations  

Directory tree:
```
.gitignore
API.md
README.md
STRUCTURE.md
moon.yml
package.json
src
  conditions
    price.test.ts
    price.ts
    time.test.ts
    time.ts
  db
    executionRepository.test.ts
    executionRepository.ts
    index.ts
    jobRepository.test.ts
    jobRepository.ts
    schema.ts
    serialization.ts
    sqlite.ts
  index.test.ts
  index.ts
  keeper
    abi.ts
    client.test.ts
    client.ts
    helpers.ts
    index.ts
  keeper.test.ts
  keeper.ts
  priceSources
    geckoTerminal.test.ts
    geckoTerminal.ts
    swappi.test.ts
    swappi.ts
  repository
    memory.test.ts
    memory.ts
  repository.ts
  retryQueue.test.ts
  retryQueue.ts
  safety.test.ts
  safety.ts
  strategies
    dca.test.ts
    dca.ts
    index.ts
    input.test.ts
    input.ts
    limitOrder.test.ts
    limitOrder.ts
    swap.test.ts
    swap.ts
    twap.test.ts
    twap.ts
    types.ts
  swap
    calldata.test.ts
    calldata.ts
    executor.test.ts
    executor.ts
    index.ts
    types.ts
  testHelpers.ts
  types.ts
tsconfig.json
vite.config.ts
vitest.config.ts
```

<!-- structure-status: enriched -->
<!-- structure-hash: 474dc29d7eba6a687b4f1f8a6956135149b724d1c539ca2e7929c707b8a69969 -->
