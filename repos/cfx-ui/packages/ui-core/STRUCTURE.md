# @cfxdevkit/ui-core — Directory Structure

## Root
- `.gitignore` — Git ignore rules  
- `API.md` — Public API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file  
- `moon.yml` — Moon repo configuration  
- `package.json` — Package metadata and dependencies  
- `tsconfig.json` — TypeScript compiler options  
- `vite.config.ts` — Vite build configuration  

## `src/`
- `index.ts` — Main entry point (exports public API)  
- `index.d.ts` / `index.d.ts.map` — Type declarations and source map for entry  
- `mainnet-catalog.generated.ts` / `.d.ts` / `.d.ts.map` — Auto-generated Mainnet token/catalog data  
- `network.ts` / `.d.ts` — Network configuration types and utilities  
- `tokens.ts` / `.d.ts` / `.d.ts.map` — Token definitions and helpers  
- `tokens.test.ts` — Unit tests for token logic  
- `wallet.ts` / `.d.ts` / `.d.ts.map` — Wallet-related utilities and types  

Directory tree:

<!-- structure-status: enriched -->
<!-- structure-hash: 6f004d6bb110be8c6c30025d8a38269892e1621d4aa0dd4a43d62adec5006a94 -->
