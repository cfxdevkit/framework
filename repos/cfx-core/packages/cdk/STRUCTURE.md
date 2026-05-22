# @cfxdevkit/cdk — Directory Structure

## Root Files
- `.gitignore` — Git ignore rules  
- `API.md` — Public API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file  
- `moon.yml` — MoonScript build configuration  
- `package.json` — Package metadata and dependencies  
- `tsconfig.json` — TypeScript compiler options  
- `vite.config.ts` — Vite bundler config (for dev/build)  
- `vitest.config.ts` — Vitest test runner config  

## `src/`
- `address/` — Address formatting and validation utilities  
  - `index.ts` — Main address module  
  - `index.test.ts` — Address tests  
- `chains/` — Chain ID and network configuration  
  - `index.ts` — Chain definitions  
  - `index.test.ts` — Chain tests  
- `client/` — Core client logic and transport  
  - `core.ts` — Main client implementation  
  - `errors.ts` — Client-specific error types  
  - `espace.ts` — ESpace (EVM-compatible space) helpers  
  - `transport.ts` — Network transport layer  
  - `index.ts` — Client entry point  
  - `*.test.ts` — Unit tests for each module  
- `errors/` — Shared error types and utilities  
  - `index.ts` — Error definitions  
  - `index.test.ts` — Error tests  
- `types/` — Shared TypeScript types  
  - `index.ts` — Type exports  
- `units/` — Unit conversion helpers (e.g., CFX → GCRUX)  
  - `index.ts` — Unit conversion logic  
  - `index.test.ts` — Unit tests  
- `wallet/` — Wallet derivation and signing  
  - `derivation.ts` — HD derivation logic  
  - `signing.ts` — Transaction signing utilities  
  - `index.ts` — Wallet entry point  
  - `*.test.ts` — Wallet tests  
- `index.ts` — Package entry point (re-exports public API)  
- `index.test.ts` — Top-level integration tests  

Directory tree:

<!-- structure-status: enriched -->
<!-- structure-hash: ae4d42983cbd11ffd999c0f5f79d407b631631b72a453d7f6bb2f78ad4ea481e -->
