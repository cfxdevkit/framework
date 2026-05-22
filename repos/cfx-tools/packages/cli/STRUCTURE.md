# @cfxdevkit/cli — CLI package structure

## Root files
- `.gitignore` — Git ignore rules  
- `API.md` — Public API documentation  
- `README.md` — Package overview and usage  
- `STRUCTURE.md` — This file  
- `moon.yml` — Moon repo workspace config  
- `package.json` — Package metadata and dependencies  
- `tsconfig.json` — TypeScript compiler options  
- `vite.config.ts` — Vite build config (for dev tooling)  
- `vitest.config.ts` — Vitest test config  

## `src/`
- `args.test.ts` — Unit tests for argument parsing  
- `args.ts` — CLI argument parsing logic  
- `bin.ts` — Entry point for CLI binary (`bin/cfx`)  
- `index.test.ts` — Unit tests for core CLI logic  
- `index.ts` — Core CLI entrypoint and orchestration  
- `run.test.ts` — Unit tests for command runner  
- `run.ts` — Command execution runner  

## `src/commands/`
- `contracts.ts` — `cfx contracts` command implementation  
- `derive.test.ts` — Unit tests for `cfx derive`  
- `derive.ts` — `cfx derive` command (key derivation)  
- `generate.test.ts` — Unit tests for `cfx generate`  
- `generate.ts` — `cfx generate` command (contract/project scaffolding)  
- `status.test.ts` — Unit tests for `cfx status`  
- `status.ts` — `cfx status` command (project/environment status)  

Directory tree:

<!-- structure-status: enriched -->
<!-- structure-hash: 4394a48f84cb07906c51e4ca721656c10363fd162532568c7fda98f5b5ec686b -->
