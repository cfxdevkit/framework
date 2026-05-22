# @cfxdevkit/contracts — Directory Structure

## Root
- `.gitignore` — Git ignore rules  
- `API.md` — Public API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file  
- `moon.yml` — MoonScript configuration  
- `package.json` — Package metadata and dependencies  
- `tsconfig.json` — TypeScript compiler options  
- `vite.config.ts` — Vite build configuration  
- `vitest.config.ts` — Vitest test configuration  

## `src/`
- `abis/` — ABI parsing and utilities  
  - `index.ts` — ABI entrypoint  
  - `index.test.ts` — ABI tests  
- `bridge/` — Cross-chain bridge logic  
  - `index.ts` — Bridge entrypoint  
  - `index.test.ts` — Bridge tests  
  - `internals.ts` — Internal bridge helpers  
- `deploy/` — Deployment scripts and helpers  
  - `core.ts` — Core deployment logic  
  - `espace.ts` — eSpace-specific deployment  
  - `index.ts` — Deployment entrypoint  
  - `index.test.ts` — Deployment tests  
  - `types.ts` — Deployment-related types  
- `erc20/` — ERC20 contract wrappers  
  - `index.ts` — ERC20 entrypoint  
  - `index.test.ts` — ERC20 tests  
- `errors/` — Error handling utilities  
  - `index.ts` — Error definitions and helpers  
  - `index.test.ts` — Error tests  
- `index.ts` — Main package entrypoint  
- `read/` — Read-only contract interactions  
  - `index.ts` — Read entrypoint  
  - `index.test.ts` — Read tests  
- `test/` — Shared test utilities  
  - `mocks.ts` — Mock contracts and helpers  
  - `mocks.test.ts` — Mock tests  
- `write/` — Write (transaction) contract interactions  
  - `core.ts` — Core write logic  
  - `espace.ts` — eSpace-specific write helpers  
  - `index.ts` — Write entrypoint  
  - `index.test.ts` — Write tests  
  - `receipt.ts` — Transaction receipt utilities  

Directory tree:

<!-- structure-status: enriched -->
<!-- structure-hash: 9bf16d5ab929461ecb820a22c78cd2263d850159b6c65229051a47701726f12b -->
